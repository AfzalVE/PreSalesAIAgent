"""
llm_client.py
=============
Thin async wrapper around the Groq API (OpenAI-compatible SDK).
All LLM calls in the proposal engine go through this module.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Type, TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# ---------------------------------------------------------------------------
# Build the Groq-compatible async client
# ---------------------------------------------------------------------------
_client: Optional[AsyncOpenAI] = None


def get_llm_client() -> AsyncOpenAI:
    """Return a singleton Groq/OpenAI async client."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            base_url="https://api.groq.com/openai/v1",
            api_key=settings.GROQ_API_KEY,
        )
    return _client


# ---------------------------------------------------------------------------
# Primary call helpers
# ---------------------------------------------------------------------------

async def call_llm_json(
    system_prompt: str,
    user_prompt: str,
    response_model: Type[T],
    model: str = "llama-3.3-70b-versatile",
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> T:
    """
    Call the LLM with JSON mode and parse the response into *response_model*.

    Args:
        system_prompt:  Full system instruction (can embed JSON schema).
        user_prompt:    User-facing content / context.
        response_model: A Pydantic model class to validate and parse the JSON.
        model:          Groq model identifier.
        temperature:    Sampling temperature (lower = more deterministic).
        max_tokens:     Maximum tokens in the completion.

    Returns:
        An instance of *response_model* populated from the LLM's JSON output.

    Raises:
        ValueError: If the LLM output cannot be validated against the schema.
        Exception:  For any network / API errors.
    """
    client = get_llm_client()
    schema_str = json.dumps(response_model.model_json_schema(), indent=2)

    full_system = (
        f"{system_prompt}\n\n"
        f"IMPORTANT: Your response MUST be valid JSON strictly matching this schema:\n"
        f"{schema_str}\n"
        f"Return ONLY the JSON object — no markdown, no code fences, no extra text."
    )

    logger.debug("Calling LLM | model=%s | response_model=%s", model, response_model.__name__)

    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": full_system},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except Exception as exc:
        logger.error("LLM API error: %s", exc)
        raise

    raw = response.choices[0].message.content
    logger.debug("LLM raw response: %s", raw[:400])

    try:
        data: Dict[str, Any] = json.loads(raw)
        return response_model(**data)
    except Exception as exc:
        logger.error("Failed to parse LLM response into %s: %s", response_model.__name__, exc)
        raise ValueError(
            f"LLM returned invalid data for {response_model.__name__}: {exc}\n"
            f"Raw output: {raw[:800]}"
        )


async def call_llm_text(
    system_prompt: str,
    user_prompt: str,
    model: str = "llama-3.3-70b-versatile",
    temperature: float = 0.4,
    max_tokens: int = 2048,
) -> str:
    """
    Call the LLM and return plain text (no JSON parsing).
    Useful for narrative sections where we need raw prose.
    """
    client = get_llm_client()
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as exc:
        logger.error("LLM text call error: %s", exc)
        raise
