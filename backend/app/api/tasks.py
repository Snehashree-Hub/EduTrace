import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.email_service import send_email


router = APIRouter(
    prefix="/api/tasks",
    tags=["Tasks"],
)


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data" / "users"

TASKS_FILE = DATA_DIR / "tasks.json"
NOTIFICATIONS_FILE = DATA_DIR / "notifications.json"
USERS_FILE = DATA_DIR / "users.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# TASK STORAGE
# =========================================================

def load_tasks():
    if not TASKS_FILE.exists():
        return []

    try:
        with open(TASKS_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []


def save_tasks(tasks):
    with open(TASKS_FILE, "w", encoding="utf-8") as file:
        json.dump(
            tasks,
            file,
            indent=2,
            ensure_ascii=False,
        )


# =========================================================
# NOTIFICATION STORAGE
# =========================================================

def load_notifications():
    if not NOTIFICATIONS_FILE.exists():
        return []

    try:
        with open(NOTIFICATIONS_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []


def save_notifications(notifications):
    with open(NOTIFICATIONS_FILE, "w", encoding="utf-8") as file:
        json.dump(
            notifications,
            file,
            indent=2,
            ensure_ascii=False,
        )


# =========================================================
# USER STORAGE
# =========================================================

def load_users():
    if not USERS_FILE.exists():
        return []

    try:
        with open(USERS_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []


def find_user(edu_id: str):
    users = load_users()

    for user in users:
        if user.get("edu_id") == edu_id:
            return user

    return None


# =========================================================
# EMAIL NOTIFICATION
# =========================================================

def send_task_email(task: dict, notification: dict):
    """
    Sends an email notification for a newly created task.

    Email is sent only when:
    1. The user exists
    2. The user has an email address
    3. email_notifications preference is enabled
    """

    user = find_user(task["edu_id"])

    if not user:
        return {
            "success": False,
            "status": "user_not_found",
            "message": "EduTrace user not found.",
        }

    email = user.get("email", "").strip()

    if not email:
        return {
            "success": False,
            "status": "email_not_found",
            "message": "No email address is registered for this user.",
        }

    preferences = user.get("preferences", {})

    email_enabled = preferences.get(
        "email_notifications",
        True,
    )

    if not email_enabled:
        return {
            "success": False,
            "status": "disabled_by_user",
            "message": "Email notifications are disabled by the user.",
            "recipient": email,
        }

    subject = f"EduTrace - New Task Added: {task['title']}"

    deadline = task.get("deadline")

    if deadline:
        deadline_line = f"Deadline: {deadline}"
    else:
        deadline_line = "Deadline: Not specified"

    message = (
        f"Hello,\n\n"
        f"A new task has been added to your EduTrace account.\n\n"
        f"Task: {task['title']}\n"
        f"Priority: {task['priority'].capitalize()}\n"
        f"Category: {task['category']}\n"
        f"Duration: {task['duration_minutes']} minutes\n"
        f"{deadline_line}\n\n"
        f"Description:\n"
        f"{task['description'] or 'No description provided.'}\n\n"
        f"Task ID: {task['task_id']}\n\n"
        f"Please log in to EduTrace to manage this task.\n\n"
        f"Regards,\n"
        f"EduTrace"
    )

    html_message = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>EduTrace - New Task Added</h2>

            <p>A new task has been added to your EduTrace account.</p>

            <table cellpadding="8" cellspacing="0" border="0">
                <tr>
                    <td><strong>Task</strong></td>
                    <td>{task['title']}</td>
                </tr>
                <tr>
                    <td><strong>Priority</strong></td>
                    <td>{task['priority'].capitalize()}</td>
                </tr>
                <tr>
                    <td><strong>Category</strong></td>
                    <td>{task['category']}</td>
                </tr>
                <tr>
                    <td><strong>Duration</strong></td>
                    <td>{task['duration_minutes']} minutes</td>
                </tr>
                <tr>
                    <td><strong>Deadline</strong></td>
                    <td>{deadline or 'Not specified'}</td>
                </tr>
                <tr>
                    <td><strong>Task ID</strong></td>
                    <td>{task['task_id']}</td>
                </tr>
            </table>

            <p>
                <strong>Description:</strong><br>
                {task['description'] or 'No description provided.'}
            </p>

            <p>Please log in to EduTrace to manage this task.</p>

            <p>
                Regards,<br>
                <strong>EduTrace</strong>
            </p>
        </body>
    </html>
    """

    email_result = send_email(
        to_email=email,
        subject=subject,
        message=message,
        html_message=html_message,
    )

    return email_result


# =========================================================
# AUTOMATIC TASK NOTIFICATION
# =========================================================

def create_task_notification(task):
    """
    Creates an in-app notification and sends an email
    when a new task is created.
    """

    notifications = load_notifications()

    task_id = task["task_id"]
    edu_id = task["edu_id"]

    # -----------------------------------------------------
    # Duplicate protection
    # -----------------------------------------------------

    for notification in notifications:
        if (
            notification.get("edu_id") == edu_id
            and notification.get("related_id") == task_id
            and notification.get("notification_type") == "task"
        ):
            return {
                "notification": notification,
                "email": {
                    "success": False,
                    "status": "duplicate",
                    "message": "Task notification already exists.",
                },
            }

    # -----------------------------------------------------
    # Notification priority
    # -----------------------------------------------------

    priority = task.get("priority", "medium")

    if priority == "high":
        notification_priority = "high"
    else:
        notification_priority = "normal"

    # -----------------------------------------------------
    # Notification message
    # -----------------------------------------------------

    deadline_text = task.get("deadline")

    if deadline_text:
        message = (
            f'Your task "{task["title"]}" is pending '
            f'and has a deadline of {deadline_text}.'
        )
    else:
        message = (
            f'Your task "{task["title"]}" has been added '
            f'to your EduTrace workspace.'
        )

    # -----------------------------------------------------
    # Create notification
    # -----------------------------------------------------

    notification = {
        "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "edu_id": edu_id,
        "title": "New Task Added",
        "message": message,
        "notification_type": "task",
        "priority": notification_priority,
        "channel": "in_app",
        "related_id": task_id,
        "read": False,
        "created_at": datetime.now().isoformat(),
    }

    notifications.append(notification)
    save_notifications(notifications)

    # -----------------------------------------------------
    # Send email
    # -----------------------------------------------------

    email_result = send_task_email(
        task,
        notification,
    )

    return {
        "notification": notification,
        "email": email_result,
    }


# =========================================================
# MODELS
# =========================================================

class TaskCreate(BaseModel):
    edu_id: str
    title: str = Field(min_length=1)
    description: str = ""
    priority: str = "medium"
    duration_minutes: int = Field(
        default=60,
        ge=15,
    )
    deadline: Optional[str] = None
    category: str = "Personal"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    duration_minutes: Optional[int] = Field(
        default=None,
        ge=15,
    )
    deadline: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


# =========================================================
# CREATE TASK
# =========================================================

@router.post("")
def create_task(request: TaskCreate):

    tasks = load_tasks()

    now = datetime.now().isoformat()

    task = {
        "task_id": f"TASK-{uuid.uuid4().hex[:8].upper()}",
        "edu_id": request.edu_id,
        "title": request.title.strip(),
        "description": request.description.strip(),
        "priority": request.priority.lower(),
        "duration_minutes": request.duration_minutes,
        "deadline": request.deadline,
        "category": request.category,
        "status": "pending",
        "created_at": now,
        "updated_at": now,
    }

    tasks.append(task)
    save_tasks(tasks)

    # Automatically create notification + email
    notification_result = create_task_notification(task)

    return {
        "message": "Task created successfully",
        "task": task,
        "notification_created": (
            notification_result is not None
        ),
        "notification": (
            notification_result.get("notification")
            if notification_result
            else None
        ),
        "email": (
            notification_result.get("email")
            if notification_result
            else None
        ),
    }


# =========================================================
# GET TASKS
# =========================================================

@router.get("/{edu_id}")
def get_tasks(edu_id: str):

    tasks = load_tasks()

    user_tasks = [
        task
        for task in tasks
        if task.get("edu_id") == edu_id
    ]

    return {
        "edu_id": edu_id,
        "count": len(user_tasks),
        "tasks": user_tasks,
    }


# =========================================================
# UPDATE TASK
# =========================================================

@router.put("/{task_id}")
def update_task(
    task_id: str,
    request: TaskUpdate,
):

    tasks = load_tasks()

    for task in tasks:

        if task.get("task_id") == task_id:

            updates = request.model_dump(
                exclude_unset=True
            )

            for key, value in updates.items():

                if value is not None:

                    if key == "title":
                        value = value.strip()

                    if key == "description":
                        value = value.strip()

                    if key == "priority":
                        value = value.lower()

                    task[key] = value

            task["updated_at"] = datetime.now().isoformat()

            save_tasks(tasks)

            return {
                "message": "Task updated successfully",
                "task": task,
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found",
    )


# =========================================================
# DELETE TASK
# =========================================================

@router.delete("/{task_id}")
def delete_task(task_id: str):

    tasks = load_tasks()

    original_count = len(tasks)

    tasks = [
        task
        for task in tasks
        if task.get("task_id") != task_id
    ]

    if len(tasks) == original_count:

        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    save_tasks(tasks)

    return {
        "message": "Task deleted successfully",
        "task_id": task_id,
    }


# =========================================================
# COMPLETE TASK
# =========================================================

@router.patch("/{task_id}/complete")
def complete_task(task_id: str):

    tasks = load_tasks()

    for task in tasks:

        if task.get("task_id") == task_id:

            task["status"] = "completed"
            task["updated_at"] = datetime.now().isoformat()

            save_tasks(tasks)

            return {
                "message": "Task marked as completed",
                "task": task,
            }

    raise HTTPException(
        status_code=404,
        detail="Task not found",
    )