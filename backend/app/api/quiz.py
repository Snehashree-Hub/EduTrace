import json
import os
import uuid
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.quiz_service import generate_quiz


router = APIRouter(
    prefix="/api/quiz",
    tags=["Academic Practice Quiz"],
)


BASE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "..",
    )
)

DATA_DIR = os.path.join(
    BASE_DIR,
    "data",
    "users",
)

RESULTS_FILE = os.path.join(
    DATA_DIR,
    "quiz_results.json",
)


# ============================================================
# MODELS
# ============================================================

class QuizGenerateRequest(BaseModel):
    edu_id: str = Field(..., min_length=1)
    subject: str = Field(..., min_length=1)
    topic: str = Field(..., min_length=1)

    exam: Optional[str] = ""

    preparation_type: Optional[str] = ""

    difficulty: str = Field(
        default="medium",
    )

    question_count: int = Field(
        default=10,
        ge=1,
        le=20,
    )


class QuizAnswer(BaseModel):
    question_id: int
    selected_answer: int = Field(
        ...,
        ge=0,
        le=3,
    )


class QuizSubmitRequest(BaseModel):
    edu_id: str = Field(..., min_length=1)

    quiz_id: str = Field(..., min_length=1)

    subject: str = Field(..., min_length=1)

    topic: str = Field(..., min_length=1)

    questions: list[dict[str, Any]]

    answers: list[QuizAnswer]


# ============================================================
# FILE HELPERS
# ============================================================

def ensure_results_file():
    os.makedirs(
        DATA_DIR,
        exist_ok=True,
    )

    if not os.path.exists(RESULTS_FILE):
        with open(
            RESULTS_FILE,
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                [],
                file,
                indent=2,
            )


def load_results():
    ensure_results_file()

    try:
        with open(
            RESULTS_FILE,
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

        return data if isinstance(data, list) else []

    except Exception:
        return []


def save_results(results):
    ensure_results_file()

    with open(
        RESULTS_FILE,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            results,
            file,
            indent=2,
            ensure_ascii=False,
        )


# ============================================================
# GENERATE QUIZ
# ============================================================

@router.post("/generate")
def generate_academic_quiz(
    request: QuizGenerateRequest,
):

    try:

        quiz = generate_quiz(
            subject=request.subject,
            topic=request.topic,
            difficulty=request.difficulty,
            question_count=request.question_count,
            exam=request.exam or "",
            preparation_type=request.preparation_type or "",
        )

        return {
            "success": True,
            "message": "Academic quiz generated successfully.",
            "quiz": quiz,
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except RuntimeError as exc:

        raise HTTPException(
            status_code=503,
            detail=str(exc),
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Quiz generation failed: {exc}",
        )


# ============================================================
# SUBMIT QUIZ
# ============================================================

@router.post("/submit")
def submit_academic_quiz(
    request: QuizSubmitRequest,
):

    if not request.questions:
        raise HTTPException(
            status_code=400,
            detail="Quiz questions are required.",
        )

    if not request.answers:
        raise HTTPException(
            status_code=400,
            detail="Quiz answers are required.",
        )

    answer_map = {
        answer.question_id: answer.selected_answer
        for answer in request.answers
    }

    correct_count = 0
    reviewed_questions = []

    for question in request.questions:

        question_id = question.get("id")

        if question_id is None:
            continue

        try:
            correct_answer = int(
                question.get("answer")
            )
        except (
            TypeError,
            ValueError,
        ):
            continue

        selected_answer = answer_map.get(
            question_id
        )

        is_correct = (
            selected_answer is not None
            and selected_answer == correct_answer
        )

        if is_correct:
            correct_count += 1

        reviewed_questions.append(
            {
                "question_id": question_id,
                "selected_answer": selected_answer,
                "correct_answer": correct_answer,
                "correct": is_correct,
            }
        )

    total_questions = len(
        request.questions
    )

    percentage = round(
        (
            correct_count
            / total_questions
        )
        * 100,
        2,
    ) if total_questions else 0

    result_id = (
        f"QRES-{uuid.uuid4().hex[:8].upper()}"
    )

    result = {
        "result_id": result_id,
        "quiz_id": request.quiz_id,
        "edu_id": request.edu_id,
        "subject": request.subject,
        "topic": request.topic,
        "total_questions": total_questions,
        "attempted_questions": len(answer_map),
        "correct_answers": correct_count,
        "wrong_answers": (
            len(answer_map) - correct_count
        ),
        "percentage": percentage,
        "xp_earned": correct_count * 10,
        "questions": reviewed_questions,
        "created_at": datetime.now().isoformat(),
    }

    results = load_results()

    results.append(result)

    save_results(results)

    # --------------------------------------------------------
    # Also record quiz performance in existing performance
    # system so Analytics / Weak Topics can use it.
    # --------------------------------------------------------

    try:

        from backend.app.api.performance import (
            PerformanceCreate,
            create_performance,
        )

        performance = PerformanceCreate(
            edu_id=request.edu_id,
            subject=request.subject,
            assessment_type="quiz",
            assessment_name=(
                f"EduTrace Quiz - {request.topic}"
            ),
            marks_obtained=correct_count,
            maximum_marks=total_questions,
            topic=request.topic,
            remarks=(
                f"Quiz ID: {request.quiz_id}"
            ),
        )

        create_performance(
            performance
        )

    except Exception as exc:

        print(
            "[QUIZ PERFORMANCE WARNING]",
            exc,
        )

    return {
        "success": True,
        "message": "Quiz submitted successfully.",
        "result": result,
    }


# ============================================================
# RESULTS
# ============================================================

@router.get("/results/{edu_id}")
def get_quiz_results(
    edu_id: str,
):

    results = load_results()

    user_results = [
        result
        for result in results
        if result.get("edu_id") == edu_id
    ]

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(user_results),
        "results": user_results,
    }


# ============================================================
# SUMMARY
# ============================================================

@router.get("/summary/{edu_id}")
def get_quiz_summary(
    edu_id: str,
):

    results = load_results()

    user_results = [
        result
        for result in results
        if result.get("edu_id") == edu_id
    ]

    if not user_results:

        return {
            "success": True,
            "edu_id": edu_id,
            "total_quizzes": 0,
            "questions_attempted": 0,
            "correct_answers": 0,
            "average_percentage": 0,
            "total_xp": 0,
        }

    questions_attempted = sum(
        result.get(
            "attempted_questions",
            0,
        )
        for result in user_results
    )

    correct_answers = sum(
        result.get(
            "correct_answers",
            0,
        )
        for result in user_results
    )

    total_xp = sum(
        result.get(
            "xp_earned",
            0,
        )
        for result in user_results
    )

    average_percentage = round(
        sum(
            result.get(
                "percentage",
                0,
            )
            for result in user_results
        )
        / len(user_results),
        2,
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "total_quizzes": len(user_results),
        "questions_attempted": questions_attempted,
        "correct_answers": correct_answers,
        "average_percentage": average_percentage,
        "total_xp": total_xp,
    }
