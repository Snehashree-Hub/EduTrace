from datetime import datetime
from pathlib import Path
import json
from typing import Optional


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
ACTIVITY_FILE = DATA_DIR / "activities.json"


def _ensure_storage():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not ACTIVITY_FILE.exists():
        ACTIVITY_FILE.write_text(
            "[]",
            encoding="utf-8"
        )


def _load_activities():
    _ensure_storage()

    try:
        data = json.loads(
            ACTIVITY_FILE.read_text(
                encoding="utf-8"
            )
        )

        if isinstance(data, list):
            return data

        return []

    except (json.JSONDecodeError, OSError):
        return []


def _save_activities(activities):
    _ensure_storage()

    ACTIVITY_FILE.write_text(
        json.dumps(
            activities,
            indent=2,
            ensure_ascii=False
        ),
        encoding="utf-8"
    )


def record_activity(
    edu_id: str,
    activity_type: str,
    description: str,
    metadata: Optional[dict] = None,
):
    """
    Record an activity for a specific EduTrace user.
    """

    if not edu_id:
        return None

    activities = _load_activities()

    activity = {
        "id": f"ACT-{datetime.now().strftime('%Y%m%d%H%M%S%f')}",
        "edu_id": edu_id,
        "activity_type": activity_type,
        "description": description,
        "metadata": metadata or {},
        "created_at": datetime.now().isoformat(),
    }

    activities.append(activity)

    _save_activities(activities)

    return activity


def get_user_activities(
    edu_id: str,
    limit: int = 50,
):
    """
    Return activities belonging only to the requested user.
    """

    activities = _load_activities()

    user_activities = [
        activity
        for activity in activities
        if activity.get("edu_id") == edu_id
    ]

    user_activities.sort(
        key=lambda item: item.get("created_at", ""),
        reverse=True,
    )

    return user_activities[:limit]


def get_all_activities(
    limit: int = 200,
):
    """
    Return activities for all users.
    Intended for admin use.
    """

    activities = _load_activities()

    activities.sort(
        key=lambda item: item.get("created_at", ""),
        reverse=True,
    )

    return activities[:limit]


def get_activity_count(edu_id: str):
    """
    Return total activity count for one user.
    """

    activities = _load_activities()

    return sum(
        1
        for activity in activities
        if activity.get("edu_id") == edu_id
    )