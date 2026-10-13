from fastapi import APIRouter, HTTPException, Query

from backend.app.services.activity_service import (
    get_user_activities,
    get_activity_count,
)


router = APIRouter(
    prefix="/api/activity",
    tags=["Activity"],
)


@router.get("/{edu_id}")
def get_activity(
    edu_id: str,
    limit: int = Query(
        default=50,
        ge=1,
        le=200,
    ),
):
    """
    Get activity history for one EduTrace user.
    """

    if not edu_id.strip():
        raise HTTPException(
            status_code=400,
            detail="EDU ID is required.",
        )

    activities = get_user_activities(
        edu_id=edu_id,
        limit=limit,
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(activities),
        "total": get_activity_count(edu_id),
        "activities": activities,
    }