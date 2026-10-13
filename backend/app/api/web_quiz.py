from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.services.web_quiz_service import (
    retrieve_exam_context,
)


router = APIRouter(
    prefix="/api/web-quiz",
    tags=["Web Quiz Retrieval"],
)


class WebQuizRequest(BaseModel):
    exam_id: str
    subject: str
    topic: str


@router.post("/context")
def get_web_quiz_context(payload: WebQuizRequest):
    result = retrieve_exam_context(
        exam_id=payload.exam_id,
        subject=payload.subject,
        topic=payload.topic,
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=502,
            detail=result.get(
                "message",
                "Unable to retrieve official web source.",
            ),
        )

    return result


@router.get("/source/{exam_id}")
def get_source(exam_id: str):
    from backend.app.services.web_quiz_service import (
        get_exam_source,
    )

    source = get_exam_source(exam_id)

    if not source:
        raise HTTPException(
            status_code=404,
            detail="No official source configured for this exam.",
        )

    return {
        "exam_id": exam_id,
        "source_name": source["name"],
        "source_url": source["url"],
    }
