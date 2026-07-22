import json
import logging

from openai import OpenAI

from app.core.config import settings
from .prompt import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

client = OpenAI(api_key=settings.OPENAI_API_KEY)


def build_user_prompt(
    project_name: str,
    project_description: str,
    requirements: str,
    preferred_technology: str,
    estimated_budget: str,
    estimated_duration: str,
    proposal_type: str,
    resources,
    tech_stack,
):
    return f"""
Project Name:
{project_name}

Project Description:
{project_description}

Business Requirements:
{requirements}

Preferred Technology:
{preferred_technology}

Estimated Budget:
{estimated_budget}

Estimated Timeline:
{estimated_duration}

Proposal Type:
{proposal_type}

Available Resources:
{json.dumps(resources, indent=2)}

Technology Stack:
{json.dumps(tech_stack, indent=2)}
"""


def validate_response(data: dict):
    required = [
        "project_name",
        "estimated_cost",
        "estimated_duration",
        "proposal_type",
        "executive_summary",
        "scope",
        "tech_stack",
        "timeline_phases",
        "assumptions",
        "risks",
        "selected_resources",
    ]

    missing = []

    for key in required:
        if key not in data:
            missing.append(key)

    if missing:
        raise ValueError(
            f"Groq response missing required fields: {', '.join(missing)}"
        )


def generate_poc(
    project_name,
    project_description,
    requirements,
    preferred_technology,
    estimated_budget,
    estimated_duration,
    proposal_type,
    resources,
    tech_stack,
):
    user_prompt = build_user_prompt(
        project_name,
        project_description,
        requirements,
        preferred_technology,
        estimated_budget,
        estimated_duration,
        proposal_type,
        resources,
        tech_stack,
    )

    logger.info("Generating POC from OpenAI...")

    response = client.chat.completions.create(
        model="gpt-4.1",
        temperature=0.2,
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ],
    )

    content = response.choices[0].message.content

    proposal = json.loads(content)

    # Backfill missing metadata fields from input arguments if LLM omitted them
    if "project_name" not in proposal or not proposal["project_name"]:
        proposal["project_name"] = project_name
    if "estimated_cost" not in proposal or not proposal["estimated_cost"]:
        try:
            proposal["estimated_cost"] = float(estimated_budget)
        except:
            proposal["estimated_cost"] = 0.0
    if "estimated_duration" not in proposal or not proposal["estimated_duration"]:
        proposal["estimated_duration"] = estimated_duration
    if "proposal_type" not in proposal or not proposal["proposal_type"]:
        proposal["proposal_type"] = proposal_type
    if "selected_resources" not in proposal or not proposal["selected_resources"]:
        proposal["selected_resources"] = resources if isinstance(resources, dict) else {"resources": resources}
    if "tech_stack" not in proposal or not proposal["tech_stack"]:
        proposal["tech_stack"] = tech_stack

    validate_response(proposal)

    logger.info("POC Generated Successfully.")

    return proposal