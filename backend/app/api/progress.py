from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Query

from backend.app.services.activity_service import get_user_activities


router = APIRouter(
    prefix="/api/progress",
    tags=["Progress"],
)


def _day_name(date_value):
    return date_value.strftime("%a")


@router.get("/{edu_id}/weekly")
def get_weekly_progress(
    edu_id: str,
    limit: int = Query(default=200, ge=1, le=500),
):
    clean_edu_id = edu_id.strip()

    if not clean_edu_id:
        raise HTTPException(
            status_code=400,
            detail="EDU ID is required.",
        )

    activities = get_user_activities(
        edu_id=clean_edu_id,
        limit=limit,
    )

    today = datetime.now().date()

    # Monday → Sunday
    monday = today - timedelta(days=today.weekday())

    weekly_data = []

    for index in range(7):
        current_date = monday + timedelta(days=index)

        count = 0

        for activity in activities:
            created_at = activity.get("created_at")

            if not created_at:
                continue

            try:
                activity_date = datetime.fromisoformat(
                    created_at.replace("Z", "+00:00")
                ).date()
            except (ValueError, TypeError):
                continue

            if activity_date == current_date:
                count += 1

        weekly_data.append(
            {
                "day": _day_name(current_date),
                "date": current_date.isoformat(),
                "activity_count": count,
            }
        )

    max_activity = max(
        [item["activity_count"] for item in weekly_data],
        default=0,
    )

    # Convert activity count into a 0–100 progress value
    for item in weekly_data:
        if max_activity > 0:
            item["value"] = round(
                (item["activity_count"] / max_activity) * 100
            )
        else:
            item["value"] = 0

    total_weekly_activity = sum(
        item["activity_count"]
        for item in weekly_data
    )

    return {
        "success": True,
        "edu_id": clean_edu_id,
        "week_start": monday.isoformat(),
        "week_end": (monday + timedelta(days=6)).isoformat(),
        "total_activity": total_weekly_activity,
        "max_daily_activity": max_activity,
        "weekly_progress": weekly_data,
    }