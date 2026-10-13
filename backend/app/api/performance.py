import json
import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(
    prefix="/api/performance",
    tags=["Academic Performance"]
)


BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

DATA_DIR = os.path.join(BASE_DIR, "data", "users")
PERFORMANCE_FILE = os.path.join(DATA_DIR, "performance.json")


# ============================================================
# MODELS
# ============================================================

class PerformanceCreate(BaseModel):
    edu_id: str
    subject: str
    assessment_type: str = Field(
        ...,
        description="exam, assignment, quiz, test, internal"
    )
    assessment_name: str
    marks_obtained: float = Field(..., ge=0)
    maximum_marks: float = Field(..., gt=0)
    topic: Optional[str] = ""
    exam_id: Optional[str] = ""
    assignment_id: Optional[str] = ""
    remarks: Optional[str] = ""


class PerformanceUpdate(BaseModel):
    subject: Optional[str] = None
    assessment_type: Optional[str] = None
    assessment_name: Optional[str] = None
    marks_obtained: Optional[float] = Field(default=None, ge=0)
    maximum_marks: Optional[float] = Field(default=None, gt=0)
    topic: Optional[str] = None
    exam_id: Optional[str] = None
    assignment_id: Optional[str] = None
    remarks: Optional[str] = None


# ============================================================
# FILE HELPERS
# ============================================================

def ensure_file():
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(PERFORMANCE_FILE):
        with open(
            PERFORMANCE_FILE,
            "w",
            encoding="utf-8"
        ) as file:
            json.dump([], file, indent=2)


def load_performance():
    ensure_file()

    try:
        with open(
            PERFORMANCE_FILE,
            "r",
            encoding="utf-8"
        ) as file:
            data = json.load(file)

        return data if isinstance(data, list) else []

    except Exception:
        return []


def save_performance(records):
    ensure_file()

    with open(
        PERFORMANCE_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            records,
            file,
            indent=2,
            ensure_ascii=False
        )


# ============================================================
# CALCULATION
# ============================================================

def calculate_percentage(marks_obtained, maximum_marks):
    if maximum_marks <= 0:
        return 0

    return round(
        (marks_obtained / maximum_marks) * 100,
        2
    )


def get_performance_level(percentage):

    if percentage >= 85:
        return "excellent"

    if percentage >= 70:
        return "good"

    if percentage >= 50:
        return "average"

    return "needs_improvement"


# ============================================================
# CREATE PERFORMANCE
# ============================================================

@router.post("")
def create_performance(performance: PerformanceCreate):

    records = load_performance()

    if performance.marks_obtained > performance.maximum_marks:
        raise HTTPException(
            status_code=400,
            detail="Marks obtained cannot be greater than maximum marks."
        )

    percentage = calculate_percentage(
        performance.marks_obtained,
        performance.maximum_marks
    )

    performance_id = (
        f"PERF-{uuid.uuid4().hex[:8].upper()}"
    )

    now = datetime.now().isoformat()

    new_record = {
        "performance_id": performance_id,
        "edu_id": performance.edu_id,
        "subject": performance.subject.strip(),
        "assessment_type": performance.assessment_type.lower(),
        "assessment_name": performance.assessment_name.strip(),
        "marks_obtained": performance.marks_obtained,
        "maximum_marks": performance.maximum_marks,
        "percentage": percentage,
        "performance_level": get_performance_level(
            percentage
        ),
        "topic": performance.topic,
        "exam_id": performance.exam_id,
        "assignment_id": performance.assignment_id,
        "remarks": performance.remarks,
        "created_at": now,
        "updated_at": now
    }

    records.append(new_record)

    save_performance(records)

    return {
        "success": True,
        "message": "Academic performance recorded successfully.",
        "performance": new_record
    }


# ============================================================
# GET ALL PERFORMANCE
# ============================================================

@router.get("/{edu_id}")
def get_performance(edu_id: str):

    records = load_performance()

    user_records = [
        record
        for record in records
        if record.get("edu_id") == edu_id
    ]

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(user_records),
        "performance": user_records
    }


# ============================================================
# PERFORMANCE SUMMARY
# ============================================================

@router.get("/{edu_id}/summary")
def get_performance_summary(edu_id: str):

    records = load_performance()

    user_records = [
        record
        for record in records
        if record.get("edu_id") == edu_id
    ]

    if not user_records:
        return {
            "success": True,
            "edu_id": edu_id,
            "total_assessments": 0,
            "overall_percentage": 0,
            "performance_level": "no_data",
            "total_marks_obtained": 0,
            "total_maximum_marks": 0
        }

    total_obtained = sum(
        record.get("marks_obtained", 0)
        for record in user_records
    )

    total_maximum = sum(
        record.get("maximum_marks", 0)
        for record in user_records
    )

    overall_percentage = calculate_percentage(
        total_obtained,
        total_maximum
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "total_assessments": len(user_records),
        "total_marks_obtained": total_obtained,
        "total_maximum_marks": total_maximum,
        "overall_percentage": overall_percentage,
        "performance_level": get_performance_level(
            overall_percentage
        )
    }


# ============================================================
# SUBJECT-WISE PERFORMANCE
# ============================================================

@router.get("/{edu_id}/subjects")
def get_subject_performance(edu_id: str):

    records = load_performance()

    user_records = [
        record
        for record in records
        if record.get("edu_id") == edu_id
    ]

    subjects = {}

    for record in user_records:

        subject = record.get(
            "subject",
            "Unknown"
        )

        if subject not in subjects:
            subjects[subject] = {
                "subject": subject,
                "total_marks_obtained": 0,
                "total_maximum_marks": 0,
                "assessments": 0
            }

        subjects[subject][
            "total_marks_obtained"
        ] += record.get("marks_obtained", 0)

        subjects[subject][
            "total_maximum_marks"
        ] += record.get("maximum_marks", 0)

        subjects[subject]["assessments"] += 1

    result = []

    for subject_data in subjects.values():

        percentage = calculate_percentage(
            subject_data["total_marks_obtained"],
            subject_data["total_maximum_marks"]
        )

        subject_data["percentage"] = percentage

        subject_data["performance_level"] = (
            get_performance_level(percentage)
        )

        result.append(subject_data)

    return {
        "success": True,
        "edu_id": edu_id,
        "subjects": result
    }


# ============================================================
# WEAK TOPICS
# ============================================================

@router.get("/{edu_id}/weak-topics")
def get_weak_topics(
    edu_id: str,
    threshold: float = 60
):

    records = load_performance()

    user_records = [
        record
        for record in records
        if record.get("edu_id") == edu_id
    ]

    topic_data = {}

    for record in user_records:

        topic = record.get("topic")

        if not topic:
            continue

        if topic not in topic_data:
            topic_data[topic] = {
                "topic": topic,
                "subject": record.get("subject"),
                "total_marks_obtained": 0,
                "total_maximum_marks": 0,
                "assessments": 0
            }

        topic_data[topic][
            "total_marks_obtained"
        ] += record.get("marks_obtained", 0)

        topic_data[topic][
            "total_maximum_marks"
        ] += record.get("maximum_marks", 0)

        topic_data[topic]["assessments"] += 1

    weak_topics = []

    for topic in topic_data.values():

        percentage = calculate_percentage(
            topic["total_marks_obtained"],
            topic["total_maximum_marks"]
        )

        topic["percentage"] = percentage

        if percentage < threshold:
            topic["status"] = "weak"
            weak_topics.append(topic)

    weak_topics.sort(
        key=lambda item: item["percentage"]
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "threshold": threshold,
        "weak_topic_count": len(weak_topics),
        "weak_topics": weak_topics
    }


# ============================================================
# GET SINGLE PERFORMANCE
# ============================================================

@router.get("/{edu_id}/record/{performance_id}")
def get_single_performance(
    edu_id: str,
    performance_id: str
):

    records = load_performance()

    for record in records:

        if (
            record.get("edu_id") == edu_id
            and record.get("performance_id")
            == performance_id
        ):
            return {
                "success": True,
                "performance": record
            }

    raise HTTPException(
        status_code=404,
        detail="Performance record not found."
    )


# ============================================================
# UPDATE PERFORMANCE
# ============================================================

@router.put("/{performance_id}")
def update_performance(
    performance_id: str,
    performance_update: PerformanceUpdate
):

    records = load_performance()

    for record in records:

        if record.get("performance_id") == performance_id:

            update_data = performance_update.model_dump(
                exclude_unset=True
            )

            for key, value in update_data.items():

                if value is not None:
                    record[key] = value

            marks_obtained = record.get(
                "marks_obtained",
                0
            )

            maximum_marks = record.get(
                "maximum_marks",
                1
            )

            if marks_obtained > maximum_marks:
                raise HTTPException(
                    status_code=400,
                    detail="Marks obtained cannot be greater than maximum marks."
                )

            percentage = calculate_percentage(
                marks_obtained,
                maximum_marks
            )

            record["percentage"] = percentage

            record["performance_level"] = (
                get_performance_level(percentage)
            )

            record["updated_at"] = (
                datetime.now().isoformat()
            )

            save_performance(records)

            return {
                "success": True,
                "message": "Performance updated successfully.",
                "performance": record
            }

    raise HTTPException(
        status_code=404,
        detail="Performance record not found."
    )


# ============================================================
# DELETE PERFORMANCE
# ============================================================

@router.delete("/{performance_id}")
def delete_performance(performance_id: str):

    records = load_performance()

    for index, record in enumerate(records):

        if record.get("performance_id") == performance_id:

            deleted = records.pop(index)

            save_performance(records)

            return {
                "success": True,
                "message": "Performance record deleted successfully.",
                "performance": deleted
            }

    raise HTTPException(
        status_code=404,
        detail="Performance record not found."
    )