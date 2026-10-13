from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.goal_service import (
    create_goal,
    get_user_goals,
    update_goal_progress,
    delete_goal,
)

from backend.app.services.activity_service import record_activity


router = APIRouter(
    prefix="/api/goals",
    tags=["Goals"],
)


class CreateGoalRequest(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    category: str = Field(
        default="Personal Goal",
        max_length=100,
    )

    progress: int = Field(
        default=0,
        ge=0,
        le=100,
    )


class UpdateGoalRequest(BaseModel):
    progress: int = Field(
        ...,
        ge=0,
        le=100,
    )


@router.post("/{edu_id}")
def create_user_goal(
    edu_id: str,
    request: CreateGoalRequest,
):
    clean_edu_id = edu_id.strip()

    if not clean_edu_id:
        raise HTTPException(
            status_code=400,
            detail="EDU ID is required.",
        )

    if not request.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Goal title is required.",
        )

    goal = create_goal(
        edu_id=clean_edu_id,
        title=request.title,
        category=request.category,
        progress=request.progress,
    )

    try:
        record_activity(
            edu_id=clean_edu_id,
            activity_type="goal_created",
            description=f"Created goal: {goal['title']}",
            metadata={
                "goal_id": goal["id"],
                "category": goal["category"],
                "progress": goal["progress"],
            },
        )
    except Exception as error:
        print(
            f"[ACTIVITY ERROR] "
            f"{type(error).__name__}: {error}"
        )

    return {
        "success": True,
        "message": "Goal created successfully.",
        "goal": goal,
    }


@router.get("/{edu_id}")
def get_goals(
    edu_id: str,
    limit: int = 50,
):
    clean_edu_id = edu_id.strip()

    if not clean_edu_id:
        raise HTTPException(
            status_code=400,
            detail="EDU ID is required.",
        )

    if limit < 1 or limit > 200:
        raise HTTPException(
            status_code=400,
            detail="Limit must be between 1 and 200.",
        )

    goals = get_user_goals(
        edu_id=clean_edu_id,
        limit=limit,
    )

    return {
        "success": True,
        "edu_id": clean_edu_id,
        "count": len(goals),
        "goals": goals,
    }


@router.patch("/{edu_id}/{goal_id}")
def update_user_goal(
    edu_id: str,
    goal_id: str,
    request: UpdateGoalRequest,
):
    clean_edu_id = edu_id.strip()

    if not clean_edu_id:
        raise HTTPException(
            status_code=400,
            detail="EDU ID is required.",
        )

    goal = update_goal_progress(
        edu_id=clean_edu_id,
        goal_id=goal_id,
        progress=request.progress,
    )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found.",
        )

    try:
        record_activity(
            edu_id=clean_edu_id,
            activity_type="goal_updated",
            description=(
                f"Updated goal progress: "
                f"{goal['title']} → {goal['progress']}%"
            ),
            metadata={
                "goal_id": goal["id"],
                "progress": goal["progress"],
                "status": goal["status"],
            },
        )
    except Exception as error:
        print(
            f"[ACTIVITY ERROR] "
            f"{type(error).__name__}: {error}"
        )

    return {
        "success": True,
        "message": "Goal progress updated.",
        "goal": goal,
    }


@router.delete("/{edu_id}/{goal_id}")
def delete_user_goal(
    edu_id: str,
    goal_id: str,
):
    clean_edu_id = edu_id.strip()

    if not clean_edu_id:
        raise HTTPException(
            status_code=400,
            detail="EDU ID is required.",
        )

    deleted = delete_goal(
        edu_id=clean_edu_id,
        goal_id=goal_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Goal not found.",
        )

    try:
        record_activity(
            edu_id=clean_edu_id,
            activity_type="goal_deleted",
            description=f"Deleted goal: {goal_id}",
            metadata={
                "goal_id": goal_id,
            },
        )
    except Exception as error:
        print(
            f"[ACTIVITY ERROR] "
            f"{type(error).__name__}: {error}"
        )

    return {
        "success": True,
        "message": "Goal deleted successfully.",
        "goal_id": goal_id,
    }