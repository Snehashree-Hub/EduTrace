import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(
    prefix="/api/calendar",
    tags=["Calendar"],
)


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "data" / "users"

CALENDAR_FILE = DATA_DIR / "calendar.json"
NOTIFICATIONS_FILE = DATA_DIR / "notifications.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# CALENDAR STORAGE
# =========================================================

def load_events():
    if not CALENDAR_FILE.exists():
        return []

    try:
        with open(
            CALENDAR_FILE,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    except (json.JSONDecodeError, OSError):
        return []


def save_events(events):
    with open(
        CALENDAR_FILE,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            events,
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
        with open(
            NOTIFICATIONS_FILE,
            "r",
            encoding="utf-8",
        ) as file:
            return json.load(file)

    except (json.JSONDecodeError, OSError):
        return []


def save_notifications(notifications):
    with open(
        NOTIFICATIONS_FILE,
        "w",
        encoding="utf-8",
    ) as file:
        json.dump(
            notifications,
            file,
            indent=2,
            ensure_ascii=False,
        )


# =========================================================
# AUTOMATIC CALENDAR NOTIFICATION
# =========================================================

def create_event_notification(event):
    """
    Automatically creates an in-app notification
    when a calendar event is created.

    Duplicate protection:
    The same event will not generate duplicate
    notifications.
    """

    notifications = load_notifications()

    event_id = event["event_id"]
    edu_id = event["edu_id"]

    # -----------------------------------------------------
    # Prevent duplicate notifications
    # -----------------------------------------------------

    for notification in notifications:

        if (
            notification.get("edu_id") == edu_id
            and notification.get("related_id") == event_id
            and notification.get("notification_type") == "calendar"
        ):
            return None

    # -----------------------------------------------------
    # Determine notification type
    # -----------------------------------------------------

    event_type = event.get(
        "event_type",
        "Personal",
    )

    event_type_lower = event_type.lower()

    if event_type_lower in {
        "exam",
        "test",
        "assessment",
        "internal",
        "quiz",
    }:

        notification_type = "exam"
        title = "Exam / Assessment Reminder"

    elif event_type_lower in {
        "meeting",
        "work",
        "project",
    }:

        notification_type = "meeting"
        title = "Upcoming Event Reminder"

    else:

        notification_type = "calendar"
        title = "Calendar Event Added"

    # -----------------------------------------------------
    # Priority
    # -----------------------------------------------------

    event_priority = event.get(
        "priority",
        "medium",
    ).lower()

    if event_priority == "high":
        notification_priority = "high"
    else:
        notification_priority = "normal"

    # -----------------------------------------------------
    # Message
    # -----------------------------------------------------

    message = (
        f'{event["title"]} is scheduled for '
        f'{event["event_date"]} from '
        f'{event["start_time"]} to '
        f'{event["end_time"]}.'
    )

    if event.get("description"):
        message += (
            f' {event["description"]}'
        )

    # -----------------------------------------------------
    # Notification object
    # -----------------------------------------------------

    notification = {
        "notification_id": (
            f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        ),
        "edu_id": edu_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "priority": notification_priority,
        "channel": "in_app",
        "related_id": event_id,
        "read": False,
        "created_at": datetime.now().isoformat(),
    }

    notifications.append(notification)

    save_notifications(notifications)

    return notification


# =========================================================
# MODELS
# =========================================================

class CalendarEventCreate(BaseModel):

    edu_id: str

    title: str = Field(
        min_length=1
    )

    description: str = ""

    event_date: str

    start_time: str

    end_time: str

    event_type: str = "Personal"

    priority: str = "medium"


class CalendarEventUpdate(BaseModel):

    title: Optional[str] = None

    description: Optional[str] = None

    event_date: Optional[str] = None

    start_time: Optional[str] = None

    end_time: Optional[str] = None

    event_type: Optional[str] = None

    priority: Optional[str] = None


# =========================================================
# TIME VALIDATION
# =========================================================

def validate_time_range(
    start_time: str,
    end_time: str,
):

    try:

        start = datetime.strptime(
            start_time,
            "%H:%M",
        )

        end = datetime.strptime(
            end_time,
            "%H:%M",
        )

        if end <= start:

            raise HTTPException(
                status_code=400,
                detail=(
                    "End time must be after "
                    "start time."
                ),
            )

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail=(
                "Time must use HH:MM format."
            ),
        )


# =========================================================
# CREATE EVENT
# =========================================================

@router.post("")
def create_event(
    request: CalendarEventCreate,
):

    validate_time_range(
        request.start_time,
        request.end_time,
    )

    events = load_events()

    now = datetime.now().isoformat()

    event = {

        "event_id": (
            f"EVENT-{uuid.uuid4().hex[:8].upper()}"
        ),

        "edu_id": request.edu_id,

        "title": request.title.strip(),

        "description": (
            request.description.strip()
        ),

        "event_date": request.event_date,

        "start_time": request.start_time,

        "end_time": request.end_time,

        "event_type": request.event_type,

        "priority": request.priority.lower(),

        "created_at": now,

        "updated_at": now,
    }

    events.append(event)

    save_events(events)

    # -----------------------------------------------------
    # Automatically create notification
    # -----------------------------------------------------

    notification = create_event_notification(
        event
    )

    return {

        "message": (
            "Calendar event created successfully"
        ),

        "event": event,

        "notification_created": (
            notification is not None
        ),
    }


# =========================================================
# GET EVENTS
# =========================================================

@router.get("/{edu_id}")
def get_events(edu_id: str):

    events = load_events()

    user_events = [

        event

        for event in events

        if event.get("edu_id") == edu_id

    ]

    user_events.sort(
        key=lambda event: (
            event.get(
                "event_date",
                "",
            ),

            event.get(
                "start_time",
                "",
            ),
        )
    )

    return {

        "edu_id": edu_id,

        "count": len(user_events),

        "events": user_events,
    }


# =========================================================
# UPDATE EVENT
# =========================================================

@router.put("/{event_id}")
def update_event(
    event_id: str,
    request: CalendarEventUpdate,
):

    events = load_events()

    for event in events:

        if event.get("event_id") == event_id:

            updates = request.model_dump(
                exclude_unset=True
            )

            new_start = updates.get(
                "start_time",
                event["start_time"],
            )

            new_end = updates.get(
                "end_time",
                event["end_time"],
            )

            validate_time_range(
                new_start,
                new_end,
            )

            for key, value in updates.items():

                if value is not None:

                    if key in {
                        "title",
                        "description",
                    }:

                        value = value.strip()

                    if key == "priority":

                        value = value.lower()

                    event[key] = value

            event["updated_at"] = (
                datetime.now().isoformat()
            )

            save_events(events)

            return {

                "message": (
                    "Calendar event updated successfully"
                ),

                "event": event,
            }

    raise HTTPException(
        status_code=404,
        detail="Calendar event not found",
    )


# =========================================================
# DELETE EVENT
# =========================================================

@router.delete("/{event_id}")
def delete_event(event_id: str):

    events = load_events()

    original_count = len(events)

    events = [

        event

        for event in events

        if event.get("event_id") != event_id

    ]

    if len(events) == original_count:

        raise HTTPException(
            status_code=404,
            detail="Calendar event not found",
        )

    save_events(events)

    return {

        "message": (
            "Calendar event deleted successfully"
        ),

        "event_id": event_id,
    }