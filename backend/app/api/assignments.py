import json
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.api.notifications import create_notification_internal

router = APIRouter(
    prefix="/api/assignments",
    tags=["Student Assignments"]
)

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

DATA_DIR = os.path.join(BASE_DIR, "data", "users")
ASSIGNMENTS_FILE = os.path.join(DATA_DIR, "assignments.json")


class AssignmentCreate(BaseModel):
    edu_id: str
    title: str
    subject: str
    deadline: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    estimated_minutes: Optional[int] = 60


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    subject: Optional[str] = None
    deadline: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    estimated_minutes: Optional[int] = None
    status: Optional[str] = None


def ensure_file():
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(ASSIGNMENTS_FILE):
        with open(ASSIGNMENTS_FILE, "w", encoding="utf-8") as file:
            json.dump([], file, indent=2)


def load_assignments():
    ensure_file()

    try:
        with open(ASSIGNMENTS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        return data if isinstance(data, list) else []

    except Exception:
        return []


def save_assignments(assignments):
    ensure_file()

    with open(ASSIGNMENTS_FILE, "w", encoding="utf-8") as file:
        json.dump(
            assignments,
            file,
            indent=2,
            ensure_ascii=False
        )


def validate_deadline(deadline: str):
    try:
        datetime.fromisoformat(deadline)
    except ValueError:
        try:
            datetime.strptime(deadline, "%Y-%m-%d")
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid deadline. Use YYYY-MM-DD or ISO datetime format."
            )


@router.post("")
def create_assignment(assignment: AssignmentCreate):

    validate_deadline(assignment.deadline)

    assignments = load_assignments()

    assignment_id = (
        f"ASSIGN-{uuid.uuid4().hex[:8].upper()}"
    )

    new_assignment = {
        "assignment_id": assignment_id,
        "edu_id": assignment.edu_id,
        "title": assignment.title.strip(),
        "subject": assignment.subject.strip(),
        "deadline": assignment.deadline,
        "description": assignment.description,
        "priority": assignment.priority,
        "estimated_minutes": assignment.estimated_minutes,
        "status": "pending",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    assignments.append(new_assignment)

    save_assignments(assignments)

    notification_result = create_notification_internal(
        edu_id=assignment.edu_id,
        title=f"Assignment Deadline: {assignment.subject}",
        message=(
            f"{assignment.title} is due on "
            f"{assignment.deadline}. "
            f"Please complete it before the deadline."
        ),
        notification_type="assignment",
        priority=assignment.priority or "medium",
        channel="email",
        related_id=assignment_id
    )

    return {
        "success": True,
        "message": "Assignment created successfully.",
        "assignment": new_assignment,
        "notification": notification_result
    }


@router.get("/{edu_id}")
def get_assignments(edu_id: str):

    assignments = load_assignments()

    user_assignments = [
        assignment
        for assignment in assignments
        if assignment.get("edu_id") == edu_id
    ]

    user_assignments.sort(
        key=lambda x: x.get("deadline", "")
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(user_assignments),
        "assignments": user_assignments
    }


@router.get("/{edu_id}/pending")
def get_pending_assignments(edu_id: str):

    assignments = load_assignments()

    pending = [
        assignment
        for assignment in assignments
        if assignment.get("edu_id") == edu_id
        and assignment.get("status") == "pending"
    ]

    pending.sort(
        key=lambda x: x.get("deadline", "")
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(pending),
        "assignments": pending
    }


@router.put("/{assignment_id}")
def update_assignment(
    assignment_id: str,
    assignment_update: AssignmentUpdate
):

    assignments = load_assignments()

    for assignment in assignments:

        if assignment.get("assignment_id") == assignment_id:

            update_data = assignment_update.model_dump(
                exclude_unset=True
            )

            if "deadline" in update_data:
                validate_deadline(
                    update_data["deadline"]
                )

            for key, value in update_data.items():

                if value is not None:
                    assignment[key] = value

            assignment["updated_at"] = (
                datetime.now().isoformat()
            )

            save_assignments(assignments)

            return {
                "success": True,
                "message": "Assignment updated successfully.",
                "assignment": assignment
            }

    raise HTTPException(
        status_code=404,
        detail="Assignment not found."
    )


@router.patch("/{assignment_id}/complete")
def complete_assignment(assignment_id: str):

    assignments = load_assignments()

    for assignment in assignments:

        if assignment.get("assignment_id") == assignment_id:

            assignment["status"] = "completed"

            assignment["updated_at"] = (
                datetime.now().isoformat()
            )

            save_assignments(assignments)

            return {
                "success": True,
                "message": "Assignment marked as completed.",
                "assignment": assignment
            }

    raise HTTPException(
        status_code=404,
        detail="Assignment not found."
    )


@router.delete("/{assignment_id}")
def delete_assignment(assignment_id: str):

    assignments = load_assignments()

    for index, assignment in enumerate(assignments):

        if assignment.get("assignment_id") == assignment_id:

            deleted_assignment = assignments.pop(index)

            save_assignments(assignments)

            return {
                "success": True,
                "message": "Assignment deleted successfully.",
                "assignment": deleted_assignment
            }

    raise HTTPException(
        status_code=404,
        detail="Assignment not found."
    )