import json
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.api.notifications import create_notification_internal

router = APIRouter(
    prefix="/api/exams",
    tags=["Student Exams"]
)

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

DATA_DIR = os.path.join(BASE_DIR, "data", "users")
EXAMS_FILE = os.path.join(DATA_DIR, "exams.json")


class ExamCreate(BaseModel):
    edu_id: str
    exam_name: str
    subject: str
    exam_date: str
    start_time: Optional[str] = None
    duration_minutes: Optional[int] = 60
    syllabus: Optional[str] = ""
    description: Optional[str] = ""
    priority: Optional[str] = "high"


class ExamUpdate(BaseModel):
    exam_name: Optional[str] = None
    subject: Optional[str] = None
    exam_date: Optional[str] = None
    start_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    syllabus: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None


def ensure_file():
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(EXAMS_FILE):
        with open(EXAMS_FILE, "w", encoding="utf-8") as file:
            json.dump([], file, indent=2)


def load_exams():
    ensure_file()

    try:
        with open(EXAMS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        return data if isinstance(data, list) else []

    except Exception:
        return []


def save_exams(exams):
    ensure_file()

    with open(EXAMS_FILE, "w", encoding="utf-8") as file:
        json.dump(exams, file, indent=2, ensure_ascii=False)


def validate_date(date_value: str):
    try:
        datetime.fromisoformat(date_value)
    except ValueError:
        try:
            datetime.strptime(date_value, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid exam date. Use YYYY-MM-DD or ISO datetime format."
            )


@router.post("")
def create_exam(exam: ExamCreate):
    validate_date(exam.exam_date)

    exams = load_exams()

    exam_id = f"EXAM-{uuid.uuid4().hex[:8].upper()}"

    new_exam = {
        "exam_id": exam_id,
        "edu_id": exam.edu_id,
        "exam_name": exam.exam_name.strip(),
        "subject": exam.subject.strip(),
        "exam_date": exam.exam_date,
        "start_time": exam.start_time,
        "duration_minutes": exam.duration_minutes,
        "syllabus": exam.syllabus,
        "description": exam.description,
        "priority": exam.priority,
        "status": "upcoming",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    exams.append(new_exam)
    save_exams(exams)

    notification_result = create_notification_internal(
        edu_id=exam.edu_id,
        title=f"Exam Reminder: {exam.subject}",
        message=(
            f"{exam.exam_name} is scheduled on "
            f"{exam.exam_date}. Start preparing early."
        ),
        notification_type="exam",
        priority="high",
        channel="email",
        related_id=exam_id
    )

    return {
        "success": True,
        "message": "Exam created successfully.",
        "exam": new_exam,
        "notification": notification_result
    }


@router.get("/{edu_id}")
def get_exams(edu_id: str):
    exams = load_exams()

    user_exams = [
        exam for exam in exams
        if exam.get("edu_id") == edu_id
    ]

    user_exams.sort(
        key=lambda x: x.get("exam_date", "")
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(user_exams),
        "exams": user_exams
    }


@router.get("/{edu_id}/upcoming")
def get_upcoming_exams(edu_id: str):
    exams = load_exams()

    upcoming = [
        exam
        for exam in exams
        if exam.get("edu_id") == edu_id
        and exam.get("status") == "upcoming"
    ]

    upcoming.sort(
        key=lambda x: x.get("exam_date", "")
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(upcoming),
        "exams": upcoming
    }


@router.put("/{exam_id}")
def update_exam(exam_id: str, exam_update: ExamUpdate):
    exams = load_exams()

    for exam in exams:
        if exam.get("exam_id") == exam_id:

            update_data = exam_update.model_dump(
                exclude_unset=True
            )

            if "exam_date" in update_data:
                validate_date(update_data["exam_date"])

            for key, value in update_data.items():
                if value is not None:
                    exam[key] = value

            exam["updated_at"] = datetime.now().isoformat()

            save_exams(exams)

            return {
                "success": True,
                "message": "Exam updated successfully.",
                "exam": exam
            }

    raise HTTPException(
        status_code=404,
        detail="Exam not found."
    )


@router.patch("/{exam_id}/complete")
def complete_exam(exam_id: str):
    exams = load_exams()

    for exam in exams:
        if exam.get("exam_id") == exam_id:
            exam["status"] = "completed"
            exam["updated_at"] = datetime.now().isoformat()

            save_exams(exams)

            return {
                "success": True,
                "message": "Exam marked as completed.",
                "exam": exam
            }

    raise HTTPException(
        status_code=404,
        detail="Exam not found."
    )


@router.delete("/{exam_id}")
def delete_exam(exam_id: str):
    exams = load_exams()

    for index, exam in enumerate(exams):
        if exam.get("exam_id") == exam_id:

            deleted_exam = exams.pop(index)
            save_exams(exams)

            return {
                "success": True,
                "message": "Exam deleted successfully.",
                "exam": deleted_exam
            }

    raise HTTPException(
        status_code=404,
        detail="Exam not found."
    )