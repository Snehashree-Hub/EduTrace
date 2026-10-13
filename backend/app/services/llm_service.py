import os
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

try:
    from groq import Groq
except ImportError:
    Groq = None


MODEL_NAME = "openai/gpt-oss-120b"


def get_model_name() -> str:
    return MODEL_NAME


def is_llm_available() -> bool:
    api_key = os.getenv("GROQ_API_KEY")

    return bool(
        api_key
        and Groq is not None
    )


def _clean_history(
    history: Optional[List[Dict[str, Any]]]
) -> List[Dict[str, str]]:

    cleaned = []

    if not history:
        return cleaned

    for item in history:

        if not isinstance(item, dict):
            continue

        role = item.get("role")
        content = item.get("content")

        if role not in {"user", "assistant"}:
            continue

        if not content:
            continue

        cleaned.append(
            {
                "role": role,
                "content": str(content),
            }
        )

    return cleaned[-12:]


def generate_chat_response(
    message: str,
    system_prompt: str = "",
    context: str = "",
    history: Optional[List[Dict[str, Any]]] = None,
) -> str:

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GROQ_API_KEY is not configured."
        )

    if Groq is None:
        raise RuntimeError(
            "Groq package is not installed."
        )

    client = Groq(
        api_key=api_key
    )

    messages = []

    # ---------------------------------------------
    # SYSTEM PROMPT
    # ---------------------------------------------

    final_system = system_prompt.strip()

    if context and context.strip():

        final_system += (
            "\n\n"
            "Additional context available to you:\n"
            "--------------------------------------\n"
            f"{context.strip()}\n"
            "--------------------------------------"
        )

    if final_system:

        messages.append(
            {
                "role": "system",
                "content": final_system,
            }
        )

    # ---------------------------------------------
    # CHAT HISTORY
    # ---------------------------------------------

    messages.extend(
        _clean_history(history)
    )

    # ---------------------------------------------
    # CURRENT USER MESSAGE
    # ---------------------------------------------

    messages.append(
        {
            "role": "user",
            "content": message.strip(),
        }
    )

    # ---------------------------------------------
    # GROQ REQUEST
    # ---------------------------------------------

    completion = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=0.55,
        max_tokens=4096,
    )

    answer = (
        completion.choices[0]
        .message
        .content
        .strip()
    )

    if not answer:

        raise RuntimeError(
            "Groq returned an empty response."
        )

    # Prevent accidental exact echo of user question.
    if answer.strip().lower() == message.strip().lower():

        messages.append(
            {
                "role": "user",
                "content": (
                    "Please answer the question properly. "
                    "Explain the concept instead of repeating "
                    "my question."
                ),
            }
        )

        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.55,
            max_tokens=4096,
        )

        answer = (
            completion.choices[0]
            .message
            .content
            .strip()
        )

    return answer
