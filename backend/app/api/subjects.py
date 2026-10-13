import json
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/subjects",
    tags=["College Subjects"]
)

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

DATA_DIR = os.path.join(BASE_DIR, "data", "users")
SUBJECTS_FILE = os.path.join(DATA_DIR, "subjects.json")


class SubjectCreate(BaseModel):
    edu_id: str
    subject_name: str
    course_code: Optional[str] = ""
    credits: Optional[float] = 0
    semester: Optional[str] = ""
    topics: Optional[list[str]] = []
    target: Optional[str] = ""


class SubjectUpdate(BaseModel):
    subject_name: Optional[str] = None
    course_code: Optional[str] = None
    credits: Optional[float] = None
    semester: Optional[str] = None
    topics: Optional[list[str]] = None
    target: Optional[str] = None


def ensure_file():
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(SUBJECTS_FILE):
        with open(SUBJECTS_FILE, "w", encoding="utf-8") as file:
            json.dump([], file, indent=2)


def load_subjects():
    ensure_file()

    try:
        with open(SUBJECTS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        return data if isinstance(data, list) else []

    except Exception:
        return []


def save_subjects(subjects):
    ensure_file()

    with open(SUBJECTS_FILE, "w", encoding="utf-8") as file:
        json.dump(
            subjects,
            file,
            indent=2,
            ensure_ascii=False
        )


@router.post("")
def create_subject(subject: SubjectCreate):

    subjects = load_subjects()

    # Prevent duplicate subject for the same user
    for existing in subjects:
        if (
            existing.get("edu_id") == subject.edu_id
            and existing.get("subject_name", "").lower()
            == subject.subject_name.lower()
        ):
            raise HTTPException(
                status_code=400,
                detail="This subject already exists for this user."
            )

    subject_id = f"SUB-{uuid.uuid4().hex[:8].upper()}"

    new_subject = {
        "subject_id": subject_id,
        "edu_id": subject.edu_id,
        "subject_name": subject.subject_name.strip(),
        "course_code": subject.course_code,
        "credits": subject.credits,
        "semester": subject.semester,
        "topics": subject.topics,
        "target": subject.target,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    subjects.append(new_subject)

    save_subjects(subjects)

    return {
        "success": True,
        "message": "Subject created successfully.",
        "subject": new_subject
    }


@router.get("/{edu_id}")
def get_subjects(edu_id: str):

    subjects = load_subjects()

    user_subjects = [
        subject
        for subject in subjects
        if subject.get("edu_id") == edu_id
    ]

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(user_subjects),
        "subjects": user_subjects
    }


@router.get("/{edu_id}/{subject_id}")
def get_subject(edu_id: str, subject_id: str):

    subjects = load_subjects()

    for subject in subjects:
        if (
            subject.get("edu_id") == edu_id
            and subject.get("subject_id") == subject_id
        ):
            return {
                "success": True,
                "subject": subject
            }

    raise HTTPException(
        status_code=404,
        detail="Subject not found."
    )


@router.put("/{subject_id}")
def update_subject(
    subject_id: str,
    subject_update: SubjectUpdate
):

    subjects = load_subjects()

    for subject in subjects:

        if subject.get("subject_id") == subject_id:

            update_data = subject_update.model_dump(
                exclude_unset=True
            )

            for key, value in update_data.items():

                if value is not None:
                    subject[key] = value

            subject["updated_at"] = datetime.now().isoformat()

            save_subjects(subjects)

            return {
                "success": True,
                "message": "Subject updated successfully.",
                "subject": subject
            }

    raise HTTPException(
        status_code=404,
        detail="Subject not found."
    )


@router.delete("/{subject_id}")
def delete_subject(subject_id: str):

    subjects = load_subjects()

    for index, subject in enumerate(subjects):

        if subject.get("subject_id") == subject_id:

            deleted_subject = subjects.pop(index)

            save_subjects(subjects)

            return {
                "success": True,
                "message": "Subject deleted successfully.",
                "subject": deleted_subject
            }

    raise HTTPException(
        status_code=404,
        detail="Subject not found."
    )