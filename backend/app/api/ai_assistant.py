from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.app.services.llm_service import (
    generate_chat_response,
    is_llm_available,
    get_model_name,
)

from backend.app.api.knowledge_rag import (
    retrieve_knowledge_chunks,
    build_rag_context,
)


router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"],
)


class ChatRequest(BaseModel):
    edu_id: str = "EDU1001"

    message: str

    use_personal_data: bool = False

    use_rag: bool = False

    document_id: Optional[str] = None

    history: List[Dict[str, Any]] = Field(
        default_factory=list
    )


@router.get("/health")
def ai_health():

    return {
        "success": True,
        "service": "EduTrace AI Assistant",
        "status": (
            "ready"
            if is_llm_available()
            else "unavailable"
        ),
        "provider": "Groq",
        "model": get_model_name(),
    }


@router.get("/capabilities")
def ai_capabilities():

    return {
        "success": True,
        "features": {
            "groq_ai": is_llm_available(),
            "local_rag": True,
            "knowledge_vault": True,
            "personalized_learning": True,
            "concept_explanation": True,
            "important_questions": True,
            "exam_preparation": True,
        },
        "model": get_model_name(),
    }


@router.post("/chat")
def chat(request: ChatRequest):

    message = request.message.strip()

    if not message:
        return {
            "success": False,
            "answer": "Please enter a question.",
            "response": "Please enter a question.",
            "edu_id": request.edu_id,
        }

    rag_results = []
    rag_context = ""

    # -------------------------------------------------
    # LOCAL RAG
    # -------------------------------------------------

    if request.use_rag:

        rag_results = retrieve_knowledge_chunks(
            query=message,
            document_id=request.document_id,
            top_k=5,
        )

        rag_context = build_rag_context(
            rag_results
        )

    # -------------------------------------------------
    # SYSTEM PROMPT
    # -------------------------------------------------

    if request.use_rag and rag_context:

        system_prompt = """
You are EduTrace AI, a friendly and intelligent
personal learning assistant.

The user has asked a question related to their
uploaded Knowledge Vault material.

Use the retrieved document context below as your
primary source of truth.

IMPORTANT RULES:

1. Explain the concept clearly and simply.
2. Stay relevant to the user's question.
3. Do not invent facts that are not supported by
   the retrieved material.
4. If the document does not contain enough information,
   clearly say that the available material is insufficient.
5. You may add general educational explanation when
   useful, but clearly distinguish it from the uploaded
   material.
6. Give examples when they help understanding.
7. Include important points.
8. If relevant, include important exam questions.
9. For exam questions, make sure the number requested
   by the user is actually provided.
10. Mention source page numbers when possible.
11. Use clean Markdown formatting.
12. Never say that you read the entire PDF if only
   retrieved chunks are available.
13. Teach naturally like a helpful tutor, not like a
   robotic textbook.

Retrieved Knowledge Vault context:
"""

    else:

        system_prompt = """
You are EduTrace AI, a friendly personal AI tutor.

Your job is to help users understand concepts,
prepare for exams, learn skills and solve problems.

Teaching style:

- Explain concepts simply.
- Use real-world examples.
- Break difficult topics into small parts.
- Highlight important points.
- Give important questions when relevant.
- Give MCQs when requested.
- Respect the user's selected subject.
- Do not introduce unrelated programming examples
  into non-programming subjects.
- Use accurate scientific and academic explanations.
- Use clean Markdown.
- Use headings, bullet points, tables and code blocks
  when useful.
- Be conversational and encouraging.
"""

    # -------------------------------------------------
    # PERSONAL DATA
    # -------------------------------------------------

    personal_context = ""

    if request.use_personal_data:

        personal_context = """
The user has enabled personalized learning.

Use available EduTrace learner context when supplied.
Do not invent attendance, marks, grades, study hours,
or other personal information.
"""

    # -------------------------------------------------
    # FINAL CONTEXT
    # -------------------------------------------------

    combined_context = ""

    if rag_context:
        combined_context += (
            "\n\nKNOWLEDGE VAULT CONTEXT:\n"
            + rag_context
        )

    if personal_context:
        combined_context += (
            "\n\nPERSONALIZATION:\n"
            + personal_context
        )

    # -------------------------------------------------
    # GROQ
    # -------------------------------------------------

    try:

        answer = generate_chat_response(
            message=message,
            system_prompt=system_prompt,
            context=combined_context,
            history=request.history,
        )

        answer = (
            answer
            if isinstance(answer, str)
            else str(answer)
        )

        sources = {}

        for result in rag_results:

            source_name = result.get(
                "source",
                "Knowledge Vault PDF"
            )

            if source_name not in sources:
                sources[source_name] = []

            page = result.get("page")

            if page is not None:
                sources[source_name].append(
                    f"Page {page}"
                )

        return {
            "success": True,

            # Main frontend field
            "answer": answer,

            # Compatibility field
            "response": answer,

            "edu_id": request.edu_id,

            "model": get_model_name(),

            "ai_provider": "Groq",

            "intent": "learning",

            "used_rag": bool(rag_results),

            "rag_used": bool(rag_results),

            "used_personal_data": (
                request.use_personal_data
            ),

            "personal_data_used": (
                request.use_personal_data
            ),

            "sources": sources,

            "source_count": len(rag_results),

            "document_id": request.document_id,

        }

    except Exception as exc:

        return {
            "success": False,

            "answer": (
                "I couldn't generate the AI response "
                "right now. Please try again."
            ),

            "response": (
                "I couldn't generate the AI response "
                "right now. Please try again."
            ),

            "edu_id": request.edu_id,

            "model": get_model_name(),

            "error": str(exc),

            "rag_used": bool(rag_results),

            "source_count": len(rag_results),
        }
