import os
from typing import Dict, List, Optional

from dotenv import load_dotenv
from groq import Groq


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()


GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b",
)


# ============================================================
# GROQ CLIENT
# ============================================================

_client: Optional[Groq] = None


def get_groq_client() -> Optional[Groq]:

    global _client

    if not GROQ_API_KEY:
        return None

    if _client is None:

        _client = Groq(
            api_key=GROQ_API_KEY
        )

    return _client


# ============================================================
# AVAILABILITY
# ============================================================

def is_llm_available() -> bool:
    """
    Check whether Groq is configured.
    """

    return bool(
        GROQ_API_KEY
    )


# ============================================================
# MESSAGE BUILDER
# ============================================================

def build_messages(
    message: str,
    system_prompt: str,
    context: str = "",
    history: Optional[
        List[Dict[str, str]]
    ] = None,
) -> List[Dict[str, str]]:

    messages: List[
        Dict[str, str]
    ] = []

    # --------------------------------------------------------
    # System prompt
    # --------------------------------------------------------

    system_content = (
        system_prompt or ""
    ).strip()

    if context:

        system_content += (
            "\n\n"
            "ADDITIONAL CONTEXT:\n"
            "Use the following context when it is relevant "
            "to the user's question.\n\n"
            f"{context}"
        )

    messages.append(
        {
            "role": "system",
            "content": system_content,
        }
    )

    # --------------------------------------------------------
    # Conversation history
    # --------------------------------------------------------

    if history:

        for item in history:

            if not isinstance(
                item,
                dict,
            ):
                continue

            role = item.get(
                "role"
            )

            content = item.get(
                "content"
            )

            if not content:
                continue

            if role not in {
                "user",
                "assistant",
            }:
                continue

            messages.append(
                {
                    "role": role,
                    "content": str(
                        content
                    ),
                }
            )

    # --------------------------------------------------------
    # Current user message
    # --------------------------------------------------------

    messages.append(
        {
            "role": "user",
            "content": message,
        }
    )

    return messages


# ============================================================
# UNICODE / MOJIBAKE CLEANUP
# ============================================================

def repair_mojibake(
    text: str,
) -> str:
    """
    Repair common UTF-8 -> Latin-1/CP1252
    mojibake such as:

        â€™
        â€œ
        â€¢
        ðŸŒŸ

    without changing normal Unicode text unnecessarily.
    """

    if not text:
        return ""

    suspicious_markers = (
        "Ã",
        "Â",
        "â",
        "ð",
        "�",
    )

    if not any(
        marker in text
        for marker in suspicious_markers
    ):
        return text

    try:

        repaired = text.encode(
            "latin-1"
        ).decode(
            "utf-8"
        )

        # Only accept the repair if it actually
        # reduces suspicious mojibake characters.
        before = sum(
            text.count(marker)
            for marker in suspicious_markers
        )

        after = sum(
            repaired.count(marker)
            for marker in suspicious_markers
        )

        if after < before:
            return repaired

    except (
        UnicodeEncodeError,
        UnicodeDecodeError,
    ):
        pass

    return text


# ============================================================
# GROQ CHAT
# ============================================================

def generate_chat_response(
    message: str,
    system_prompt: str,
    context: str = "",
    history: Optional[
        List[Dict[str, str]]
    ] = None,
) -> str:

    client = get_groq_client()

    if client is None:

        raise RuntimeError(
            "GROQ_API_KEY is not configured."
        )

    messages = build_messages(
        message=message,
        system_prompt=system_prompt,
        context=context,
        history=history or [],
    )

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,

        # Slightly creative but still
        # controlled for educational answers.
        temperature=0.25,

        # 900 was too short for a complete
        # concept + examples + questions lesson.
        max_completion_tokens=1800,
    )

    if not response.choices:

        raise RuntimeError(
            "Groq returned an empty response."
        )

    answer = response.choices[
        0
    ].message.content

    if not answer:

        raise RuntimeError(
            "Groq returned an empty AI response."
        )

    answer = answer.strip()

    answer = repair_mojibake(
        answer
    )

    return answer.strip()


# ============================================================
# PROVIDER INFORMATION
# ============================================================

def get_llm_provider() -> str:
    return "Groq"


def get_llm_model() -> str:
    return GROQ_MODEL
