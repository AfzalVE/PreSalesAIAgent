import json
from openai import AsyncOpenAI
from pydantic import ValidationError
from app.core.config import settings
from app.schemas.ai_agent_schema import AgentTextInput, AgentExtractionResponse

# Initialize the OpenAI client asynchronously, pointing to Groq's API
client = AsyncOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=settings.GROQ_API_KEY
)

async def extract_proposal_requirements(input_data: AgentTextInput) -> AgentExtractionResponse:
    """
    Calls the Groq API (via OpenAI SDK) in JSON mode to parse unstructured text
    and extract the proposal requirements.
    """
    
    # We dynamically generate the JSON schema from our Pydantic model to instruct the LLM
    schema_str = json.dumps(AgentExtractionResponse.model_json_schema(), indent=2)

    system_prompt = f"""
    You are an expert Pre-Sales AI Agent for a software development company.
    Your job is to read unstructured text from a user (which could be a transcribed voice message or typed text)
    and extract project requirements into a structured JSON format.

    Here are the rules:
    1. Extract the `project_name`. If none is apparent, create a generic but descriptive one.
    2. Extract `timeline_weeks`. If none is mentioned by the user, LEAVE IT NULL. Do not invent a timeline. The downstream Employee Module will calculate it.
    3. Extract `client_budget`. If none is mentioned by the user, LEAVE IT NULL. Do not invent a budget. The Employee Module will calculate it.
    4. Extract `resource_requirements`. If the user mentions them, use them. If none are mentioned, LEAVE IT NULL.
    5. Generate a `proposal_id` (e.g. "PROP-001" or a random unique identifier) if one is not clearly specified.
    6. `follow_up_message`: Even if you leave fields null for the Employee module, if the user didn't provide budget, timeline, or resources, you must populate this field to ask them if they have specific numbers in mind (e.g., "Do you have a specific budget or timeline in mind for this?"). If they provided everything, leave it null.
    
    Ensure your output strictly follows this JSON schema:
    {schema_str}
    
    Return ONLY valid JSON.
    """

    try:
        response = await client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": input_data.text}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        
        # Parse the JSON string returned by Groq
        response_content = response.choices[0].message.content
        extracted_dict = json.loads(response_content)
        
        # Validate against our Pydantic model
        extracted_data = AgentExtractionResponse(**extracted_dict)
        return extracted_data
        
    except ValidationError as ve:
        print(f"Pydantic Validation Error: {ve}")
        raise ValueError(f"The LLM returned invalid data: {ve}")
    except Exception as e:
        print(f"Error calling Groq API: {str(e)}")
        raise e
