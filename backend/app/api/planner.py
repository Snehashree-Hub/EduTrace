from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from pathlib import Path
import json
import uuid


router = APIRouter(
    prefix="/api/planner",
    tags=["Smart Planner"]
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[3]

USERS_DATA_DIR = BASE_DIR / "data" / "users"

TASKS_FILE = USERS_DATA_DIR / "tasks.json"
CALENDAR_FILE = USERS_DATA_DIR / "calendar.json"
NOTIFICATIONS_FILE = USERS_DATA_DIR / "notifications.json"


# ============================================================
# REQUEST MODELS
# ============================================================

class PlanRequest(BaseModel):
    edu_id: str
    plan_date: Optional[str] = None
    start_time: str = "09:00"
    end_time: str = "21:00"
    available_hours: Optional[float] = None


# ============================================================
# FILE HELPERS
# ============================================================

def load_json_file(path: Path):

    if not path.exists():
        return []

    try:

        with open(path, "r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            return data

        return []

    except Exception:
        return []


def save_json_file(path: Path, data):

    path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            data,
            file,
            indent=2,
            ensure_ascii=False
        )


def load_tasks(edu_id: str):

    tasks = load_json_file(TASKS_FILE)

    return [
        task
        for task in tasks
        if task.get("edu_id") == edu_id
    ]


def load_calendar_events(edu_id: str):

    events = load_json_file(CALENDAR_FILE)

    return [
        event
        for event in events
        if event.get("edu_id") == edu_id
    ]


# ============================================================
# SMART PLANNER NOTIFICATION
# ============================================================

def create_planner_notification(
    edu_id: str,
    plan_date: str,
    task_count: int,
    event_count: int,
    planned_minutes: int,
    remaining_minutes: int
):
    """
    Create an automatic notification when a Smart Plan
    is successfully generated.

    Duplicate protection:
    The same EDU ID + plan date will not create multiple
    Smart Planner notifications.
    """

    notifications = load_json_file(
        NOTIFICATIONS_FILE
    )

    # --------------------------------------------------------
    # DUPLICATE PROTECTION
    # --------------------------------------------------------

    for notification in notifications:

        if (
            notification.get("edu_id") == edu_id
            and notification.get("notification_type") == "planner"
            and notification.get("related_id") == plan_date
        ):

            return False

    # --------------------------------------------------------
    # NOTIFICATION
    # --------------------------------------------------------

    notification = {
        "notification_id": f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
        "edu_id": edu_id,
        "title": "Smart Planner Ready",
        "message": (
            f"Your Smart Plan for {plan_date} is ready. "
            f"{task_count} task block(s) and "
            f"{event_count} fixed event(s) are scheduled. "
            f"{planned_minutes} minutes are planned, with "
            f"{remaining_minutes} minutes remaining."
        ),
        "notification_type": "planner",
        "priority": "normal",
        "channel": "browser",
        "related_id": plan_date,
        "read": False,
        "created_at": datetime.now().isoformat()
    }

    notifications.append(notification)

    save_json_file(
        NOTIFICATIONS_FILE,
        notifications
    )

    return True


# ============================================================
# TIME HELPERS
# ============================================================

def time_to_minutes(value: str) -> int:

    try:

        hours, minutes = value.split(":")

        hours = int(hours)
        minutes = int(minutes)

        if hours < 0 or hours > 23:
            raise ValueError

        if minutes < 0 or minutes > 59:
            raise ValueError

        return hours * 60 + minutes

    except Exception:

        raise ValueError(
            f"Invalid time format: {value}"
        )


def minutes_to_time(total_minutes: int) -> str:

    hours = total_minutes // 60
    minutes = total_minutes % 60

    return f"{hours:02d}:{minutes:02d}"


def normalize_date(value):

    if not value:
        return None

    try:

        return datetime.strptime(
            value,
            "%Y-%m-%d"
        ).date()

    except Exception:

        return None


# ============================================================
# PRIORITY
# ============================================================

PRIORITY_SCORE = {
    "urgent": 4,
    "high": 3,
    "medium": 2,
    "low": 1
}


def get_priority_score(priority):

    return PRIORITY_SCORE.get(
        str(priority or "medium").lower(),
        2
    )


# ============================================================
# TASK SORTING
# ============================================================

def task_sort_key(task):

    priority = get_priority_score(
        task.get("priority")
    )

    deadline = normalize_date(
        task.get("deadline")
    )

    deadline_value = (
        deadline.toordinal()
        if deadline
        else 999999999
    )

    return (
        -priority,
        deadline_value,
        str(
            task.get(
                "created_at",
                ""
            )
        )
    )


# ============================================================
# BUILD FIXED EVENTS
# ============================================================

def prepare_events(
    events,
    selected_date,
    day_start,
    day_end
):

    prepared = []

    for event in events:

        event_date = normalize_date(
            event.get("event_date")
        )

        if event_date != selected_date:
            continue

        try:

            start = time_to_minutes(
                event.get(
                    "start_time",
                    "00:00"
                )
            )

            end = time_to_minutes(
                event.get(
                    "end_time",
                    "00:00"
                )
            )

        except Exception:

            continue

        if end <= start:
            continue

        start = max(
            start,
            day_start
        )

        end = min(
            end,
            day_end
        )

        if start >= end:
            continue

        prepared.append({
            "type": "event",
            "event_id": event.get(
                "event_id"
            ),
            "title": event.get(
                "title",
                "Calendar Event"
            ),
            "description": event.get(
                "description",
                ""
            ),
            "event_type": event.get(
                "event_type",
                "Event"
            ),
            "priority": event.get(
                "priority",
                "medium"
            ),
            "start": start,
            "end": end,
            "duration_minutes": end - start
        })

    prepared.sort(
        key=lambda x: x["start"]
    )

    return prepared


# ============================================================
# FIND FREE TIME SLOTS
# ============================================================

def find_free_slots(
    day_start,
    day_end,
    fixed_events
):

    slots = []

    current = day_start

    for event in fixed_events:

        event_start = event["start"]
        event_end = event["end"]

        if current < event_start:

            slots.append({
                "start": current,
                "end": event_start,
                "duration_minutes": (
                    event_start - current
                )
            })

        current = max(
            current,
            event_end
        )

    if current < day_end:

        slots.append({
            "start": current,
            "end": day_end,
            "duration_minutes": (
                day_end - current
            )
        })

    return slots


# ============================================================
# CREATE TASK BLOCKS
# ============================================================

def schedule_tasks(
    tasks,
    free_slots
):

    blocks = []

    slot_index = 0
    slot_position = 0

    for task in tasks:

        if slot_index >= len(free_slots):
            break

        try:

            duration = int(
                task.get(
                    "duration_minutes",
                    30
                )
            )

        except Exception:

            duration = 30

        duration = max(
            15,
            duration
        )

        remaining_task_minutes = duration

        while remaining_task_minutes > 0:

            if slot_index >= len(free_slots):
                break

            slot = free_slots[slot_index]

            slot_start = (
                slot["start"]
                + slot_position
            )

            slot_remaining = (
                slot["end"]
                - slot_start
            )

            if slot_remaining <= 0:

                slot_index += 1
                slot_position = 0

                continue

            block_duration = min(
                remaining_task_minutes,
                slot_remaining
            )

            block_end = (
                slot_start
                + block_duration
            )

            blocks.append({
                "type": "task",
                "task_id": task.get(
                    "task_id"
                ),
                "title": task.get(
                    "title",
                    "Untitled Task"
                ),
                "description": task.get(
                    "description",
                    ""
                ),
                "category": task.get(
                    "category",
                    "General"
                ),
                "priority": task.get(
                    "priority",
                    "medium"
                ),
                "start": slot_start,
                "end": block_end,
                "duration_minutes": block_duration,
                "status": "planned"
            })

            remaining_task_minutes -= (
                block_duration
            )

            slot_position += (
                block_duration
            )

            if slot_position >= (
                slot["end"]
                - slot["start"]
            ):

                slot_index += 1
                slot_position = 0

    return blocks


# ============================================================
# ADD BREAKS
# ============================================================

def add_breaks(blocks):

    if not blocks:
        return []

    result = []

    for index, block in enumerate(blocks):

        result.append(block)

        if block["type"] != "task":
            continue

        duration = block[
            "duration_minutes"
        ]

        if duration < 60:
            continue

        if index == len(blocks) - 1:
            continue

        next_block = blocks[
            index + 1
        ]

        gap = (
            next_block["start"]
            - block["end"]
        )

        if gap >= 10:

            break_duration = min(
                10,
                gap
            )

            result.append({
                "type": "break",
                "title": "Short Break",
                "description": (
                    "Take a short break "
                    "and refresh."
                ),
                "start": block["end"],
                "end": (
                    block["end"]
                    + break_duration
                ),
                "duration_minutes": (
                    break_duration
                ),
                "status": "recommended"
            })

    return result


# ============================================================
# FORMAT BLOCK
# ============================================================

def format_block(block):

    formatted = {
        "type": block["type"],
        "title": block["title"],
        "start_time": minutes_to_time(
            block["start"]
        ),
        "end_time": minutes_to_time(
            block["end"]
        ),
        "duration_minutes": (
            block["duration_minutes"]
        ),
        "status": block.get(
            "status",
            "scheduled"
        )
    }

    optional_fields = [
        "task_id",
        "event_id",
        "description",
        "priority",
        "category",
        "event_type"
    ]

    for field in optional_fields:

        if field in block:
            formatted[field] = block[field]

    return formatted


# ============================================================
# MAIN SMART PLANNER
# ============================================================

@router.post("/plan")
def create_smart_plan(
    request: PlanRequest
):

    try:

        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        if request.plan_date:

            selected_date = normalize_date(
                request.plan_date
            )

            if not selected_date:

                raise HTTPException(
                    status_code=400,
                    detail=(
                        "plan_date must use "
                        "YYYY-MM-DD format"
                    )
                )

        else:

            selected_date = date.today()

        # ----------------------------------------------------
        # DAY RANGE
        # ----------------------------------------------------

        try:

            day_start = time_to_minutes(
                request.start_time
            )

            day_end = time_to_minutes(
                request.end_time
            )

        except ValueError as error:

            raise HTTPException(
                status_code=400,
                detail=str(error)
            )

        if day_end <= day_start:

            raise HTTPException(
                status_code=400,
                detail=(
                    "end_time must be later "
                    "than start_time"
                )
            )

        # ----------------------------------------------------
        # LOAD USER DATA
        # ----------------------------------------------------

        tasks = load_tasks(
            request.edu_id
        )

        events = load_calendar_events(
            request.edu_id
        )

        # ----------------------------------------------------
        # REMOVE COMPLETED TASKS
        # ----------------------------------------------------

        pending_tasks = [
            task
            for task in tasks
            if str(
                task.get(
                    "status",
                    "pending"
                )
            ).lower()
            not in {
                "completed",
                "complete",
                "done"
            }
        ]

        # ----------------------------------------------------
        # RELEVANT TASKS
        # ----------------------------------------------------

        relevant_tasks = []

        for task in pending_tasks:

            deadline = normalize_date(
                task.get("deadline")
            )

            if deadline is None:

                relevant_tasks.append(task)

                continue

            if deadline <= selected_date:

                relevant_tasks.append(task)

                continue

            if deadline >= selected_date:

                relevant_tasks.append(task)

        relevant_tasks.sort(
            key=task_sort_key
        )

        # ----------------------------------------------------
        # FIXED CALENDAR EVENTS
        # ----------------------------------------------------

        fixed_events = prepare_events(
            events,
            selected_date,
            day_start,
            day_end
        )

        # ----------------------------------------------------
        # FREE TIME
        # ----------------------------------------------------

        free_slots = find_free_slots(
            day_start,
            day_end,
            fixed_events
        )

        # ----------------------------------------------------
        # SCHEDULE TASKS
        # ----------------------------------------------------

        task_blocks = schedule_tasks(
            relevant_tasks,
            free_slots
        )

        # ----------------------------------------------------
        # MERGE EVENTS + TASKS
        # ----------------------------------------------------

        all_blocks = []

        for event in fixed_events:

            event["status"] = "fixed"

            all_blocks.append(event)

        all_blocks.extend(
            task_blocks
        )

        all_blocks.sort(
            key=lambda block: (
                block["start"],
                0
                if block["type"] == "event"
                else 1
            )
        )

        # ----------------------------------------------------
        # ADD BREAKS
        # ----------------------------------------------------

        final_blocks = add_breaks(
            all_blocks
        )

        final_blocks.sort(
            key=lambda block: block["start"]
        )

        # ----------------------------------------------------
        # STATISTICS
        # ----------------------------------------------------

        total_day_minutes = (
            day_end - day_start
        )

        planned_task_minutes = sum(
            block["duration_minutes"]
            for block in final_blocks
            if block["type"] == "task"
        )

        fixed_event_minutes = sum(
            block["duration_minutes"]
            for block in final_blocks
            if block["type"] == "event"
        )

        break_minutes = sum(
            block["duration_minutes"]
            for block in final_blocks
            if block["type"] == "break"
        )

        used_minutes = (
            planned_task_minutes
            + fixed_event_minutes
            + break_minutes
        )

        remaining_minutes = max(
            0,
            total_day_minutes
            - used_minutes
        )

        # ----------------------------------------------------
        # UNSCHEDULED TASKS
        # ----------------------------------------------------

        unscheduled_tasks = []

        scheduled_task_ids = {
            block.get("task_id")
            for block in final_blocks
            if block["type"] == "task"
        }

        for task in relevant_tasks:

            task_id = task.get(
                "task_id"
            )

            if task_id not in scheduled_task_ids:

                unscheduled_tasks.append({
                    "task_id": task_id,
                    "title": task.get(
                        "title",
                        "Untitled Task"
                    ),
                    "priority": task.get(
                        "priority",
                        "medium"
                    ),
                    "duration_minutes": task.get(
                        "duration_minutes",
                        30
                    ),
                    "deadline": task.get(
                        "deadline"
                    )
                })

        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------

        task_count = sum(
            1
            for block in final_blocks
            if block["type"] == "task"
        )

        event_count = sum(
            1
            for block in final_blocks
            if block["type"] == "event"
        )

        summary = (
            f"Your Smart Plan for "
            f"{selected_date.isoformat()} "
            f"contains {task_count} "
            f"task block(s) and "
            f"{event_count} fixed event(s). "
            f"{planned_task_minutes} minutes "
            f"are planned for tasks, with "
            f"{remaining_minutes} minutes "
            f"remaining."
        )

        # ----------------------------------------------------
        # AUTOMATIC NOTIFICATION
        # ----------------------------------------------------

        notification_created = (
            create_planner_notification(
                edu_id=request.edu_id,
                plan_date=selected_date.isoformat(),
                task_count=task_count,
                event_count=event_count,
                planned_minutes=planned_task_minutes,
                remaining_minutes=remaining_minutes
            )
        )

        # ----------------------------------------------------
        # RESPONSE
        # ----------------------------------------------------

        return {
            "edu_id": request.edu_id,

            "plan_date": (
                selected_date.isoformat()
            ),

            "working_hours": {
                "start_time": request.start_time,
                "end_time": request.end_time,
                "total_minutes": (
                    total_day_minutes
                ),
                "total_hours": round(
                    total_day_minutes / 60,
                    2
                )
            },

            "statistics": {
                "planned_task_minutes": (
                    planned_task_minutes
                ),
                "fixed_event_minutes": (
                    fixed_event_minutes
                ),
                "break_minutes": (
                    break_minutes
                ),
                "used_minutes": (
                    used_minutes
                ),
                "remaining_minutes": (
                    remaining_minutes
                ),
                "planned_task_hours": round(
                    planned_task_minutes / 60,
                    2
                ),
                "remaining_hours": round(
                    remaining_minutes / 60,
                    2
                )
            },

            "blocks": [
                format_block(block)
                for block in final_blocks
            ],

            "unscheduled_tasks": (
                unscheduled_tasks
            ),

            "summary": summary,

            "notification_created": (
                notification_created
            ),

            "data_source": {
                "tasks": True,
                "calendar": True,
                "automatic": True
            }
        }

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Smart Planner error: "
                f"{str(error)}"
            )
        )


# ============================================================
# QUICK DAILY SUMMARY
# ============================================================

@router.get("/summary/{edu_id}")
def planner_summary(
    edu_id: str
):

    tasks = load_tasks(
        edu_id
    )

    events = load_calendar_events(
        edu_id
    )

    pending_tasks = [
        task
        for task in tasks
        if str(
            task.get(
                "status",
                "pending"
            )
        ).lower()
        not in {
            "completed",
            "complete",
            "done"
        }
    ]

    today = date.today()

    today_events = [
        event
        for event in events
        if normalize_date(
            event.get("event_date")
        ) == today
    ]

    overdue_tasks = []

    for task in pending_tasks:

        deadline = normalize_date(
            task.get("deadline")
        )

        if deadline and deadline < today:

            overdue_tasks.append(task)

    upcoming_tasks = []

    for task in pending_tasks:

        deadline = normalize_date(
            task.get("deadline")
        )

        if deadline and deadline >= today:

            upcoming_tasks.append(task)

    return {
        "edu_id": edu_id,
        "date": today.isoformat(),
        "pending_tasks": len(
            pending_tasks
        ),
        "today_events": len(
            today_events
        ),
        "overdue_tasks": len(
            overdue_tasks
        ),
        "upcoming_tasks": len(
            upcoming_tasks
        )
    }