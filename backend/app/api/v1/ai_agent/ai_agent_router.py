from fastapi import APIRouter, HTTPException
from app.schemas.ai_agent_schema import AgentTextInput, AgentExtractionResponse, NegotiationInput, NegotiationResponse
from app.services.ai.ai_agent_service import extract_proposal_requirements, negotiate_proposal

router = APIRouter()

@router.post("/extract-requirements", response_model=AgentExtractionResponse)
async def extract_requirements(input_data: AgentTextInput):
    """
    Extracts proposal requirements from unstructured text using the AI Agent.
    If some information is missing, the agent will suggest values and provide a follow-up message.
    """
    try:
        extracted_data = await extract_proposal_requirements(input_data)
        return extracted_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract requirements: {str(e)}")

@router.post("/negotiate", response_model=NegotiationResponse)
async def negotiate(input_data: NegotiationInput):
    """
    Negotiates proposal parameters using the AI Agent.
    """
    try:
        negotiation_data = await negotiate_proposal(input_data)
        return negotiation_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to negotiate: {str(e)}")

