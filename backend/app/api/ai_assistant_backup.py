from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.llm_service import (
    generate_chat_response,
    get_llm_model,
    get_llm_provider,
    is_llm_available,
)

from backend.rag.rag_service import (
    build_rag_context,
    search_documents,
)

try:
    from backend.app.services.activity_service import record_activity
except Exception:
    record_activity = None


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Assistant"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):
    edu_id: str = Field(
        default="EDU1001",
        min_length=1,
    )

    message: str = Field(
        ...,
        min_length=1,
    )

    use_personal_data: bool = False

    use_rag: bool = False

    history: List[Dict[str, str]] = Field(
        default_factory=list
    )

    context: Optional[Dict[str, Any]] = None


# ============================================================
# RESPONSE MODEL
# ============================================================

class ChatResponse(BaseModel):
    success: bool
    edu_id: str
    message: str
    answer: str
    intent: str
    ai_provider: str
    rag_used: bool
    personal_data_used: bool
    sources: List[Dict[str, Any]] = Field(
        default_factory=list
    )
    source_count: int = 0


# ============================================================
# CONTEXT HELPERS
# ============================================================

def get_context_value(
    context: Optional[Dict[str, Any]],
    *keys: str,
) -> Any:

    if not context:
        return None

    for key in keys:
        value = context.get(key)

        if value is not None:
            return value

    return None


def build_learning_context(
    context: Optional[Dict[str, Any]],
) -> Dict[str, Any]:

    if not context:
        return {}

    data = {
        "type": get_context_value(
            context,
            "type",
        ),

        "source": get_context_value(
            context,
            "source",
        ),

        "exam_type": get_context_value(
            context,
            "examType",
            "exam_type",
            "preparationType",
            "preparation_type",
        ),

        "exam": get_context_value(
            context,
            "exam",
            "examName",
            "exam_name",
            "goal",
        ),

        "subject": get_context_value(
            context,
            "subject",
        ),

        "topic": get_context_value(
            context,
            "topic",
            "title",
        ),

        "day": get_context_value(
            context,
            "day",
        ),

        "duration": get_context_value(
            context,
            "duration",
        ),

        "difficulty": get_context_value(
            context,
            "skill",
            "difficulty",
        ),

        "total_days": get_context_value(
            context,
            "totalDays",
            "total_days",
        ),

        "daily_hours": get_context_value(
            context,
            "dailyHours",
            "daily_hours",
        ),

        "topics": get_context_value(
            context,
            "topics",
            "subtopics",
        ),

        "practice": get_context_value(
            context,
            "practice",
            "practiceRequirements",
            "practice_requirements",
        ),

        "document_name": get_context_value(
            context,
            "documentName",
            "filename",
            "fileName",
        ),
    }

    return {
        key: value
        for key, value in data.items()
        if value not in (None, "", [])
    }


# ============================================================
# INTENT DETECTION
# ============================================================

def detect_intent(message: str) -> str:

    text = (
        message or ""
    ).lower().strip()

    if not text:
        return "general"


    # --------------------------------------------------------
    # GREETING
    # --------------------------------------------------------

    greetings = [
        "hello",
        "hi",
        "hey",
        "hai",
        "good morning",
        "good afternoon",
        "good evening",
        "good night",
        "who are you",
        "what are you",
        "introduce yourself",
    ]

    if any(
        phrase in text
        for phrase in greetings
    ):
        return "greeting"


    # --------------------------------------------------------
    # STUDY PLAN
    #
    # IMPORTANT:
    # This is BEFORE Calendar.
    #
    # "today" should NOT automatically mean calendar.
    # --------------------------------------------------------

    study_plan_phrases = [
        "study plan",
        "learning plan",
        "learning session",
        "start learning",
        "start today's learning",
        "start todays learning",
        "today's learning session",
        "todays learning session",
        "start today's session",
        "start todays session",
        "begin learning",
        "begin today's lesson",
        "begin todays lesson",
        "start my lesson",
        "start the lesson",
        "continue learning",
        "continue my learning",
        "teach me today's topic",
        "teach me todays topic",
        "teach today's topic",
        "teach todays topic",
    ]

    if any(
        phrase in text
        for phrase in study_plan_phrases
    ):
        return "study_plan"


    # --------------------------------------------------------
    # LEARNING
    # --------------------------------------------------------

    learning_phrases = [
        "teach me",
        "explain this topic",
        "explain the topic",
        "help me learn",
        "help me understand",
        "learn about",
        "study this",
        "teach this",
    ]

    if any(
        phrase in text
        for phrase in learning_phrases
    ):
        return "learning"


    # --------------------------------------------------------
    # LEARNING ARENA
    # --------------------------------------------------------

    game_phrases = [
        "game",
        "games",
        "learning arena",
        "play a game",
        "quiz game",
        "challenge me",
        "fun quiz",
    ]

    if any(
        phrase in text
        for phrase in game_phrases
    ):
        return "game_lab"


    # --------------------------------------------------------
    # PERFORMANCE
    # --------------------------------------------------------

    performance_phrases = [
        "my performance",
        "my marks",
        "my scores",
        "my grades",
        "my progress",
        "how am i doing",
        "academic performance",
        "performance report",
    ]

    if any(
        phrase in text
        for phrase in performance_phrases
    ):
        return "performance"


    # --------------------------------------------------------
    # WEAK TOPICS
    # --------------------------------------------------------

    weak_topic_phrases = [
        "weak topic",
        "weak topics",
        "weak area",
        "weak areas",
        "what should i improve",
        "where am i weak",
        "my weak areas",
        "areas i need to improve",
    ]

    if any(
        phrase in text
        for phrase in weak_topic_phrases
    ):
        return "weak_topics"


    # --------------------------------------------------------
    # EXAMS
    # --------------------------------------------------------

    exam_phrases = [
        "exam preparation",
        "prepare for exam",
        "prepare for my exam",
        "exam prep",
        "important questions",
        "important topics",
        "previous year questions",
        "previous year papers",
        "pyq",
        "pyqs",
        "mock test",
        "revision",
    ]

    if any(
        phrase in text
        for phrase in exam_phrases
    ):
        return "exams"


    # --------------------------------------------------------
    # ASSIGNMENTS
    # --------------------------------------------------------

    assignment_phrases = [
        "assignment",
        "assignments",
        "homework",
        "project work",
        "lab work",
    ]

    if any(
        phrase in text
        for phrase in assignment_phrases
    ):
        return "assignments"


    # --------------------------------------------------------
    # TASKS
    # --------------------------------------------------------

    task_phrases = [
        "my tasks",
        "task list",
        "create a task",
        "add a task",
        "pending tasks",
        "todo",
        "to do",
    ]

    if any(
        phrase in text
        for phrase in task_phrases
    ):
        return "tasks"


    # --------------------------------------------------------
    # SUBJECTS
    # --------------------------------------------------------

    subject_phrases = [
        "subject",
        "subjects",
        "chemistry",
        "physics",
        "biology",
        "mathematics",
        "maths",
        "math",
        "computer science",
        "programming",
        "python",
        "english",
        "tamil",
        "dbms",
        "operating system",
        "networks",
        "data science",
        "machine learning",
        "artificial intelligence",
    ]

    if any(
        phrase in text
        for phrase in subject_phrases
    ):
        return "subjects"


    # --------------------------------------------------------
    # CALENDAR
    #
    # Only explicit calendar-related words.
    # "today" by itself is NOT Calendar.
    # --------------------------------------------------------

    calendar_phrases = [
        "calendar",
        "calendar event",
        "calendar events",
        "schedule",
        "meeting",
        "meetings",
        "appointment",
        "appointments",
        "event reminder",
    ]

    if any(
        phrase in text
        for phrase in calendar_phrases
    ):
        return "calendar"


    # --------------------------------------------------------
    # KNOWLEDGE VAULT / RAG
    # --------------------------------------------------------

    rag_phrases = [
        "knowledge vault",
        "uploaded document",
        "uploaded documents",
        "my document",
        "my documents",
        "uploaded notes",
        "my notes",
        "according to my notes",
        "from my notes",
        "from the document",
        "from this document",
        "according to the document",
        "explain my pdf",
        "explain this pdf",
        "summarize my document",
        "summarize this document",
        "search my notes",
        "search my documents",
    ]

    if any(
        phrase in text
        for phrase in rag_phrases
    ):
        return "rag"


    return "general"


# ============================================================
# RAG DECISION
# ============================================================

def should_use_rag(
    request: ChatRequest,
    intent: str,
    learning_context: Dict[str, Any],
) -> bool:

    if request.use_rag:
        return True

    if intent == "rag":
        return True

    document_name = learning_context.get(
        "document_name"
    )

    source = learning_context.get(
        "source"
    )

    context_type = learning_context.get(
        "type"
    )

    if document_name:
        return True

    if source in {
        "knowledge",
        "knowledge-vault",
    }:
        return True

    if context_type == "knowledge-document":
        return True

    return False


# ============================================================
# RAG SEARCH
# ============================================================

def run_rag(
    edu_id: str,
    query: str,
    top_k: int = 5,
) -> Dict[str, Any]:

    try:

        results = search_documents(
            edu_id=edu_id,
            query=query,
            top_k=top_k,
        )

    except Exception as exc:

        return {
            "used": False,
            "results": [],
            "context": "",
            "sources": [],
            "error": str(exc),
        }

    if not results:

        return {
            "used": False,
            "results": [],
            "context": "",
            "sources": [],
        }


    try:

        rag_context = build_rag_context(
            results
        )

    except Exception:

        chunks = []

        for item in results:

            filename = item.get(
                "filename",
                "Unknown document",
            )

            chunk_index = item.get(
                "chunk_index",
                0,
            )

            chunk_text = item.get(
                "text",
                "",
            )

            chunks.append(
                "SOURCE: "
                + str(filename)
                + "\n"
                + "CHUNK: "
                + str(chunk_index)
                + "\n"
                + str(chunk_text)
            )

        rag_context = "\n\n".join(
            chunks
        )


    source_map: Dict[str, Dict[str, Any]] = {}


    for item in results:

        filename = item.get(
            "filename",
            "Unknown document",
        )

        score = float(
            item.get(
                "score",
                0,
            )
            or 0
        )

        relevance = int(
            max(
                60,
                min(
                    100,
                    score * 100,
                ),
            )
        )

        if (
            filename not in source_map
            or relevance
            > source_map[filename]["relevance"]
        ):

            source_map[filename] = {
                "filename": filename,
                "relevance": relevance,
                "score": score,
                "chunk_index": item.get(
                    "chunk_index"
                ),
            }


    return {
        "used": True,
        "results": results,
        "context": rag_context,
        "sources": list(
            source_map.values()
        ),
    }


# ============================================================
# LEARNING CONTEXT PROMPT
# ============================================================

def build_learning_prompt(
    learning_context: Dict[str, Any],
) -> str:

    if not learning_context:
        return ""

    lines = [
        "ACTIVE EDUTRACE LEARNING CONTEXT",
        "The user selected this context from EduTrace.",
        "Treat it as authoritative.",
        "",
    ]


    fields = [
        ("type", "Context type"),
        ("day", "Day"),
        ("exam_type", "Preparation type"),
        ("exam", "Exam / goal"),
        ("subject", "SUBJECT"),
        ("topic", "SELECTED TOPIC"),
        ("duration", "Session duration"),
        ("difficulty", "Difficulty"),
        ("total_days", "Total preparation days"),
        ("daily_hours", "Daily study hours"),
    ]


    for key, label in fields:

        value = learning_context.get(
            key
        )

        if value is not None:

            lines.append(
                f"{label}: {value}"
            )


    topics = learning_context.get(
        "topics"
    )

    if topics:

        lines.append(
            "Today's subtopics:"
        )

        if isinstance(
            topics,
            list,
        ):

            for item in topics:

                lines.append(
                    f"- {item}"
                )

        else:

            lines.append(
                str(topics)
            )


    practice = learning_context.get(
        "practice"
    )

    if practice:

        lines.append(
            "Practice requirements:"
        )

        if isinstance(
            practice,
            list,
        ):

            for item in practice:

                lines.append(
                    f"- {item}"
                )

        else:

            lines.append(
                str(practice)
            )


    document_name = learning_context.get(
        "document_name"
    )

    if document_name:

        lines.append(
            f"Selected document: {document_name}"
        )


    return "\n".join(
        lines
    )


# ============================================================
# SYSTEM PROMPT
# ============================================================

def build_system_prompt(
    intent: str,
    learning_context: Dict[str, Any],
    rag_used: bool,
) -> str:

    subject = str(
        learning_context.get(
            "subject",
            "",
        )
    )

    topic = str(
        learning_context.get(
            "topic",
            "",
        )
    )

    exam = str(
        learning_context.get(
            "exam",
            "",
        )
    )


    prompt = """
You are EduTrace AI, a friendly personal AI tutor and learning assistant.

Your main responsibilities are:
- teaching concepts
- helping with exam preparation
- explaining uploaded study material
- creating practice questions
- supporting Study Plans
- helping users learn naturally

IMPORTANT RULES:

1. Explain concepts before testing the user.
2. Do not give only a list of questions.
3. Use simple, clear language.
4. Give relevant examples.
5. Stay focused on the user's selected subject.
6. Never randomly switch to another subject.
7. Do not invent sources.
8. Do not claim to have read a document unless retrieved document context exists.
9. If the user asks for an exact number of questions, give exactly that number.
10. Use clean Markdown.
11. Do not use raw HTML.
12. Do not use HTML tags such as <br>, <div>, or <p>.
13. Keep scientific explanations accurate.
14. Use normal UTF-8 characters.
15. Be friendly and conversational rather than sounding like a dry textbook.

SUBJECT CONSISTENCY:

The selected subject is authoritative.

If the subject is Chemistry:
Use Chemistry examples such as atoms, molecules, reactions, equations,
periodic trends and chemical concepts.

If the subject is Physics:
Use Physics examples such as motion, forces, energy, electricity,
waves, units and formulas.

If the subject is Mathematics:
Use mathematical expressions, calculations and worked examples.

If the subject is Biology:
Use Biology examples involving cells, genetics, physiology, organisms
and biological processes.

If the subject is Computer Science:
Use Computer Science examples.

If the subject is Python:
Use Python examples and code when appropriate.

If the subject is DBMS:
Use databases and SQL when appropriate.

If the subject is English:
Use English language, grammar, vocabulary and writing examples.

If the subject is Tamil:
Use Tamil language or literature examples.

Never insert unrelated Python or programming examples into Chemistry,
Physics, Biology, Mathematics, English, Tamil or another unrelated subject.

STUDY PLAN TEACHING:

When a Study Plan context is active:

- The user has already selected the topic.
- Do not ask what they want to learn.
- Start teaching immediately.
- Explain the concept first.
- Give relevant examples.
- Explain important points.
- Give exam-focused information.
- Give important questions or MCQs.
- End with a short practice challenge or natural follow-up.

Recommended lesson structure:

1. Friendly opening
2. What the topic means
3. Core concept
4. Simple explanation
5. Relevant examples
6. Important points
7. Exam-focused points
8. Important questions or MCQs
9. Short practice challenge
10. Natural follow-up

MARKDOWN:

Use proper Markdown.

Example:

# Main Heading

## Section

- Point one
- Point two

1. First
2. Second

**Important**

inline code

Use code blocks only when code is actually relevant.

Do not output raw HTML.
"""

    prompt += "\n\nCURRENT INTENT:\n"
    prompt += str(intent)

    prompt += "\n\nSELECTED SUBJECT:\n"
    prompt += (
        subject
        if subject
        else "Not specified"
    )

    prompt += "\n\nSELECTED TOPIC:\n"
    prompt += (
        topic
        if topic
        else "Not specified"
    )

    prompt += "\n\nEXAM / GOAL:\n"
    prompt += (
        exam
        if exam
        else "Not specified"
    )


    if learning_context:

        prompt += """
 
ACTIVE LEARNING CONTEXT:

"""

        prompt += build_learning_prompt(
            learning_context
        )

        prompt += """

The active learning context is authoritative.

If the user says "Start today's learning session",
"Start learning", "Begin today's lesson", or similar,
immediately teach the selected topic.

Do not ask the user to choose another topic.
"""


    if rag_used:

        prompt += """

KNOWLEDGE VAULT / RAG:

Retrieved content may come from the user's uploaded documents.

When answering document-specific questions:

- Prioritize retrieved document content.
- Explain retrieved content clearly.
- Do not invent document facts.
- If the retrieved content is insufficient, say so.
- Do not claim that the entire document was retrieved.
- Mention the source filename when useful.
"""


    if intent == "study_plan":

        prompt += """

STUDY PLAN MODE:

The user is currently following a Study Plan.

Act like a friendly AI tutor.

Start the selected lesson immediately.

Do not say:
"What would you like to learn?"

"""


    if intent == "exams":

        prompt += """

EXAM MODE:

Focus on exam preparation.

Teach the concept first.

Then provide important points, exam-focused notes,
important questions and practice questions where useful.

Do not claim something is an official previous-year question
unless the available source actually supports that claim.
"""


    if intent == "rag":

        prompt += """

KNOWLEDGE VAULT MODE:

When the user asks about an uploaded document,
use retrieved document content as the primary source.

Do not invent information from the document.
"""


    return prompt.strip()


# ============================================================
# ACTIVITY
# ============================================================

def record_ai_activity_safe(
    edu_id: str,
    message: str,
    intent: str,
    rag_used: bool,
    personal_data_used: bool,
    learning_context: Dict[str, Any],
) -> None:

    if record_activity is None:
        return

    try:

        record_activity(
            edu_id=edu_id,
            activity_type="ai_chat",
            title="AI Assistant",
            description=message[:200],
            metadata={
                "intent": intent,
                "rag_used": rag_used,
                "personal_data_used": personal_data_used,
                "learning_context_used": bool(
                    learning_context
                ),
            },
        )

    except Exception:
        pass


# ============================================================
# CHAT ENDPOINT
# ============================================================

@router.post(
    "/chat",
    response_model=ChatResponse,
)
def chat(
    request: ChatRequest,
):

    edu_id = (
        request.edu_id
        or "EDU1001"
    ).strip()

    message = (
        request.message
        or ""
    ).strip()


    if not message:

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )


    # --------------------------------------------------------
    # Build context
    # --------------------------------------------------------

    learning_context = build_learning_context(
        request.context
    )


    # --------------------------------------------------------
    # Detect intent
    # --------------------------------------------------------

    intent = detect_intent(
        message
    )


    # --------------------------------------------------------
    # Study Plan context has priority
    # --------------------------------------------------------

    context_type = learning_context.get(
        "type"
    )

    context_source = learning_context.get(
        "source"
    )

    if (
        context_type == "study-plan"
        or context_source == "study-plan"
    ):

        intent = "study_plan"


    # --------------------------------------------------------
    # RAG
    # --------------------------------------------------------

    rag_requested = should_use_rag(
        request=request,
        intent=intent,
        learning_context=learning_context,
    )


    rag_data = {
        "used": False,
        "results": [],
        "context": "",
        "sources": [],
    }


    if rag_requested:

        rag_data = run_rag(
            edu_id=edu_id,
            query=message,
            top_k=5,
        )


    rag_used = bool(
        rag_data.get(
            "used",
            False,
        )
    )


    # --------------------------------------------------------
    # System prompt
    # --------------------------------------------------------

    system_prompt = build_system_prompt(
        intent=intent,
        learning_context=learning_context,
        rag_used=rag_used,
    )


    # --------------------------------------------------------
    # Additional context
    # --------------------------------------------------------

    context_parts: List[str] = []


    if learning_context:

        context_parts.append(
            build_learning_prompt(
                learning_context
            )
        )


    if rag_data.get(
        "context"
    ):

        context_parts.append(
            "RETRIEVED KNOWLEDGE VAULT CONTENT:\n\n"
            + str(
                rag_data.get(
                    "context"
                )
            )
        )


    combined_context = "\n\n".join(
        context_parts
    )


    # --------------------------------------------------------
    # Check Groq
    # --------------------------------------------------------

    if not is_llm_available():

        raise HTTPException(
            status_code=503,
            detail=(
                "Groq AI is not configured. "
                "Please configure GROQ_API_KEY."
            ),
        )


    # --------------------------------------------------------
    # Generate AI response
    # --------------------------------------------------------

    try:

        answer = generate_chat_response(
            message=message,
            system_prompt=system_prompt,
            context=combined_context,
            history=request.history,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"AI generation failed: {exc}",
        )


    # --------------------------------------------------------
    # Activity
    # --------------------------------------------------------

    personal_data_used = bool(
        request.use_personal_data
    )


    record_ai_activity_safe(
        edu_id=edu_id,
        message=message,
        intent=intent,
        rag_used=rag_used,
        personal_data_used=personal_data_used,
        learning_context=learning_context,
    )


    # --------------------------------------------------------
    # Return response
    # --------------------------------------------------------

    return ChatResponse(
        success=True,
        edu_id=edu_id,
        message=message,
        answer=answer,
        intent=intent,
        ai_provider=get_llm_provider(),
        rag_used=rag_used,
        personal_data_used=personal_data_used,
        sources=rag_data.get(
            "sources",
            [],
        ),
        source_count=len(
            rag_data.get(
                "sources",
                [],
            )
        ),
    )


# ============================================================
# STATUS
# ============================================================

@router.get("/status")
def ai_status():

    return {
        "success": True,
        "available": is_llm_available(),
        "provider": get_llm_provider(),
        "model": get_llm_model(),
        "features": [
            "AI chat",
            "Subject-aware teaching",
            "Exam-aware learning",
            "Study Plan context",
            "Concept explanations",
            "Relevant examples",
            "Important questions",
            "Practice questions",
            "Knowledge Vault RAG",
        ],
    }


# ============================================================
# CAPABILITIES
# ============================================================

@router.get("/capabilities")
def ai_capabilities():

    return {
        "success": True,
        "provider": get_llm_provider(),
        "model": get_llm_model(),
        "available": is_llm_available(),

        "capabilities": {
            "general_chat": True,
            "subject_aware_teaching": True,
            "exam_aware_learning": True,
            "study_plan_context": True,
            "concept_explanations": True,
            "relevant_examples": True,
            "important_questions": True,
            "practice_questions": True,
            "knowledge_vault": True,
            "rag": True,
            "conversation_history": True,
            "personal_data_flag": True,
        },

        "supported_preparation_types": [
            "Government Exams",
            "Entrance Exams",
            "School Exams",
            "College Exams",
            "Competitive Exams",
            "Skill / Career Learning",
            "Custom Preparation",
        ],
    }


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
def ai_health():

    return {
        "success": True,
        "status": (
            "online"
            if is_llm_available()
            else "not_configured"
        ),
        "provider": get_llm_provider(),
        "model": get_llm_model(),
    }
