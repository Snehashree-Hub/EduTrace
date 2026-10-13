from dotenv import load_dotenv

# =========================================================
# LOAD ENVIRONMENT VARIABLES FIRST
# =========================================================
# Must happen before importing routers/services that depend
# on environment variables such as GROQ_API_KEY.
load_dotenv()


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# =========================================================
# API ROUTERS
# =========================================================

from backend.app.api.auth import router as auth_router
from backend.app.api.edu_id import router as edu_id_router
from backend.app.api.ai_assistant import router as ai_assistant_router
from backend.app.api.planner import router as planner_router
from backend.app.api.tasks import router as tasks_router
from backend.app.api.calendar import router as calendar_router
from backend.app.api.rag import router as rag_router
from backend.app.api.notifications import router as notifications_router
from backend.app.api.exams import router as exams_router
from backend.app.api.assignments import router as assignments_router
from backend.app.api.subjects import router as subjects_router
from backend.app.api.performance import router as performance_router
from backend.app.api.study_plan import router as study_plan_router
from backend.app.api.games import router as games_router
from backend.app.api.activity import router as activity_router
from backend.app.api.progress import router as progress_router
from backend.app.api.goals import router as goals_router
from backend.app.api.admin import router as admin_router

# ---------------------------------------------------------
# Knowledge Vault PDF Upload
# ---------------------------------------------------------
from backend.app.api.knowledge import router as knowledge_router

# ---------------------------------------------------------
# Live web retrieval for source-grounded quizzes
# ---------------------------------------------------------
from backend.app.api.web_quiz import router as web_quiz_router

# ---------------------------------------------------------
# Academic AI Practice Quiz
# ---------------------------------------------------------
from backend.app.api.quiz import router as quiz_router


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="EduTrace",
    description=(
        "Personal AI Learning & Productivity Assistant "
        "with adaptive learning, RAG, quizzes and "
        "web-grounded study support."
    ),
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

# ---------------------------------------------------------
# Authentication
# ---------------------------------------------------------
app.include_router(auth_router)


# ---------------------------------------------------------
# EDU ID
# ---------------------------------------------------------
app.include_router(edu_id_router)


# ---------------------------------------------------------
# AI Assistant
# ---------------------------------------------------------
app.include_router(ai_assistant_router)


# ---------------------------------------------------------
# Smart Planner
# ---------------------------------------------------------
app.include_router(planner_router)


# ---------------------------------------------------------
# Tasks
# ---------------------------------------------------------
app.include_router(tasks_router)


# ---------------------------------------------------------
# Calendar
# ---------------------------------------------------------
app.include_router(calendar_router)


# ---------------------------------------------------------
# RAG / Existing Knowledge Vault
# ---------------------------------------------------------
app.include_router(rag_router)


# ---------------------------------------------------------
# Knowledge Vault PDF Upload
# ---------------------------------------------------------
# GET  /api/knowledge/health
# POST /api/knowledge/upload
# ---------------------------------------------------------
app.include_router(knowledge_router)


# ---------------------------------------------------------
# Notifications
# ---------------------------------------------------------
app.include_router(notifications_router)


# ---------------------------------------------------------
# Exams
# ---------------------------------------------------------
app.include_router(exams_router)


# ---------------------------------------------------------
# Assignments
# ---------------------------------------------------------
app.include_router(assignments_router)


# ---------------------------------------------------------
# Subjects
# ---------------------------------------------------------
app.include_router(subjects_router)


# ---------------------------------------------------------
# Academic Performance
# ---------------------------------------------------------
app.include_router(performance_router)


# ---------------------------------------------------------
# Study Plan
# ---------------------------------------------------------
app.include_router(study_plan_router)


# ---------------------------------------------------------
# Games / Learning Arena
# ---------------------------------------------------------
app.include_router(games_router)


# ---------------------------------------------------------
# Activity
# ---------------------------------------------------------
app.include_router(activity_router)


# ---------------------------------------------------------
# Progress
# ---------------------------------------------------------
app.include_router(progress_router)


# ---------------------------------------------------------
# Goals
# ---------------------------------------------------------
app.include_router(goals_router)


# ---------------------------------------------------------
# Admin
# ---------------------------------------------------------
app.include_router(admin_router)


# ---------------------------------------------------------
# Live Web Quiz Retrieval
# ---------------------------------------------------------
# POST /api/web-quiz/context
# GET  /api/web-quiz/source/{exam_id}
# ---------------------------------------------------------
app.include_router(web_quiz_router)


# ---------------------------------------------------------
# Academic Practice Quiz
# ---------------------------------------------------------
# POST /api/quiz/generate
# POST /api/quiz/submit
# GET  /api/quiz/results/{edu_id}
# GET  /api/quiz/summary/{edu_id}
# ---------------------------------------------------------
app.include_router(quiz_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "name": "EduTrace",
        "version": "1.0.0",
        "status": "running",
        "message": "EduTrace API is running successfully",
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "EduTrace API",
        "version": "1.0.0",
    }


# =========================================================
# API STATUS
# =========================================================

@app.get("/api/status")
def api_status():
    return {
        "status": "online",
        "name": "EduTrace",
        "features": {
            "ai_assistant": True,
            "rag": True,
            "knowledge_vault_pdf_upload": True,
            "adaptive_learning": True,
            "quizzes": True,
            "games": True,
            "study_plan": True,
            "live_web_quiz": True,
            "academic_practice_quiz": True,
        },
    }