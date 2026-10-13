from fastapi import APIRouter, Query

from backend.app.services.activity_service import (
    get_all_activities,
)

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
)


@router.get("/activities")
def admin_activities(
    limit: int = Query(
        default=200,
        ge=1,
        le=1000,
    ),
):
    activities = get_all_activities(
        limit=limit
    )

    return {
        "success": True,
        "count": len(activities),
        "activities": activities,
    }


@router.get("/summary")
def admin_summary():
    activities = get_all_activities(
        limit=1000
    )

    unique_users = sorted(
        {
            item.get("edu_id")
            for item in activities
            if item.get("edu_id")
        }
    )

    return {
        "success": True,
        "total_activities": len(
            activities
        ),
        "active_users": len(
            unique_users
        ),
        "unique_edu_ids": unique_users,
    }