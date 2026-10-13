import json
from datetime import datetime
from pathlib import Path
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"
GOALS_FILE = DATA_DIR / "goals.json"


def _ensure_storage():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not GOALS_FILE.exists():
        GOALS_FILE.write_text(
            "[]",
            encoding="utf-8",
        )


def _load_goals():
    _ensure_storage()

    try:
        data = json.loads(
            GOALS_FILE.read_text(
                encoding="utf-8"
            )
        )

        if isinstance(data, list):
            return data

        return []

    except (
        json.JSONDecodeError,
        OSError,
    ):
        return []


def _save_goals(goals):
    _ensure_storage()

    GOALS_FILE.write_text(
        json.dumps(
            goals,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def create_goal(
    edu_id: str,
    title: str,
    category: str = "Personal Goal",
    progress: int = 0,
):
    goals = _load_goals()

    goal = {
        "id": f"GOAL-{uuid4().hex[:10].upper()}",
        "edu_id": edu_id,
        "title": title.strip(),
        "category": category.strip(),
        "progress": max(
            0,
            min(progress, 100),
        ),
        "status": "completed"
        if progress >= 100
        else "active",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }

    goals.append(goal)
    _save_goals(goals)

    return goal


def get_user_goals(
    edu_id: str,
    limit: int = 50,
):
    goals = _load_goals()

    user_goals = [
        goal
        for goal in goals
        if goal.get("edu_id") == edu_id
    ]

    user_goals.sort(
        key=lambda item: item.get(
            "updated_at",
            "",
        ),
        reverse=True,
    )

    return user_goals[:limit]


def update_goal_progress(
    edu_id: str,
    goal_id: str,
    progress: int,
):
    goals = _load_goals()

    for goal in goals:
        if (
            goal.get("id") == goal_id
            and goal.get("edu_id") == edu_id
        ):
            progress = max(
                0,
                min(progress, 100),
            )

            goal["progress"] = progress

            goal["status"] = (
                "completed"
                if progress >= 100
                else "active"
            )

            goal["updated_at"] = (
                datetime.now().isoformat()
            )

            _save_goals(goals)

            return goal

    return None


def delete_goal(
    edu_id: str,
    goal_id: str,
):
    goals = _load_goals()

    updated_goals = [
        goal
        for goal in goals
        if not (
            goal.get("id") == goal_id
            and goal.get("edu_id") == edu_id
        )
    ]

    deleted = len(updated_goals) != len(goals)

    if deleted:
        _save_goals(updated_goals)

    return deleted