# backend/app/api/study_plan.py

from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime, date, timedelta
import json
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/study-plan",
    tags=["Smart Study Plan"]
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[3]

DATA_DIR = BASE_DIR / "data" / "users"

EXAMS_FILE = DATA_DIR / "exams.json"
ASSIGNMENTS_FILE = DATA_DIR / "assignments.json"
SUBJECTS_FILE = DATA_DIR / "subjects.json"
PERFORMANCE_FILE = DATA_DIR / "performance.json"
STUDY_PLANS_FILE = DATA_DIR / "study_plans.json"


# ============================================================
# REQUEST MODEL
# ============================================================

class StudyPlanGenerateRequest(BaseModel):

    edu_id: str

    days: int = Field(
        default=7,
        ge=1,
        le=30
    )

    threshold: float = Field(
        default=60,
        ge=0,
        le=100
    )


# ============================================================
# JSON HELPERS
# ============================================================

def load_json(
    file_path: Path,
    default: Any
) -> Any:

    try:

        if not file_path.exists():
            return default

        with open(
            file_path,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)

    except Exception:

        return default


def save_json(
    file_path: Path,
    data: Any
) -> bool:

    try:

        file_path.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        with open(
            file_path,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                data,
                file,
                indent=2,
                ensure_ascii=False
            )

        return True

    except Exception:

        return False


def normalize_list(
    data: Any
) -> List[Dict]:

    if isinstance(data, list):

        return [
            item
            for item in data
            if isinstance(item, dict)
        ]

    if isinstance(data, dict):

        for key in (
            "data",
            "items",
            "records",
            "exams",
            "assignments",
            "subjects",
            "performance",
            "study_plans",
            "plans"
        ):

            value = data.get(key)

            if isinstance(value, list):

                return [
                    item
                    for item in value
                    if isinstance(item, dict)
                ]

    return []


def find_by_edu_id(
    data: Any,
    edu_id: str
) -> List[Dict]:

    records = normalize_list(data)

    target = edu_id.strip().upper()

    return [
        record
        for record in records
        if str(
            record.get(
                "edu_id",
                ""
            )
        ).strip().upper()
        == target
    ]


# ============================================================
# DATA LOADERS
# ============================================================

def get_exams(
    edu_id: str
) -> List[Dict]:

    return find_by_edu_id(
        load_json(
            EXAMS_FILE,
            []
        ),
        edu_id
    )


def get_assignments(
    edu_id: str
) -> List[Dict]:

    return find_by_edu_id(
        load_json(
            ASSIGNMENTS_FILE,
            []
        ),
        edu_id
    )


def get_subjects(
    edu_id: str
) -> List[Dict]:

    return find_by_edu_id(
        load_json(
            SUBJECTS_FILE,
            []
        ),
        edu_id
    )


def get_performance(
    edu_id: str
) -> List[Dict]:

    return find_by_edu_id(
        load_json(
            PERFORMANCE_FILE,
            []
        ),
        edu_id
    )


# ============================================================
# DATE HELPERS
# ============================================================

def parse_date(
    value: Any
) -> Optional[date]:

    if not value:
        return None

    text = str(value).strip()

    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%S.%f"
    ]

    for fmt in formats:

        try:

            return datetime.strptime(
                text,
                fmt
            ).date()

        except Exception:
            continue

    try:

        return datetime.fromisoformat(
            text.replace(
                "Z",
                ""
            )
        ).date()

    except Exception:

        return None


def record_date(
    record: Dict,
    *keys
) -> Optional[date]:

    for key in keys:

        parsed = parse_date(
            record.get(key)
        )

        if parsed:
            return parsed

    return None


# ============================================================
# PERFORMANCE ANALYSIS
# ============================================================

def analyze_weak_topics(
    performance: List[Dict],
    threshold: float
) -> List[Dict]:

    grouped = {}

    for record in performance:

        subject = (
            record.get(
                "subject"
            )
            or "General"
        ).strip()

        topic = (
            record.get(
                "topic"
            )
            or ""
        ).strip()

        if not topic:
            continue

        try:

            obtained = float(
                record.get(
                    "marks_obtained",
                    0
                )
            )

            maximum = float(
                record.get(
                    "maximum_marks",
                    0
                )
            )

        except Exception:

            continue

        if maximum <= 0:
            continue

        key = (
            subject.lower(),
            topic.lower()
        )

        if key not in grouped:

            grouped[key] = {
                "subject": subject,
                "topic": topic,
                "obtained": 0.0,
                "maximum": 0.0,
                "assessments": 0
            }

        grouped[key]["obtained"] += obtained
        grouped[key]["maximum"] += maximum
        grouped[key]["assessments"] += 1

    result = []

    for data in grouped.values():

        percentage = (
            data["obtained"]
            / data["maximum"]
            * 100
        )

        if percentage >= threshold:
            continue

        if percentage < 40:

            priority = "high"

        elif percentage < 50:

            priority = "medium-high"

        else:

            priority = "medium"

        result.append(
            {
                "subject": data["subject"],
                "topic": data["topic"],
                "percentage": round(
                    percentage,
                    2
                ),
                "assessments": data[
                    "assessments"
                ],
                "priority": priority
            }
        )

    priority_order = {
        "high": 0,
        "medium-high": 1,
        "medium": 2
    }

    result.sort(
        key=lambda item: (
            priority_order.get(
                item["priority"],
                99
            ),
            item["percentage"]
        )
    )

    return result


# ============================================================
# SUBJECT HELPERS
# ============================================================

def get_subject_topics(
    subjects: List[Dict]
) -> List[Dict]:

    result = []

    for subject in subjects:

        name = (
            subject.get(
                "subject_name"
            )
            or subject.get(
                "name"
            )
            or "General Subject"
        )

        topics = subject.get(
            "topics",
            []
        )

        if isinstance(
            topics,
            str
        ):

            topics = [
                item.strip()
                for item in topics.split(",")
                if item.strip()
            ]

        if not isinstance(
            topics,
            list
        ):

            topics = []

        result.append(
            {
                "subject": name,
                "topics": [
                    str(topic)
                    for topic in topics
                    if str(topic).strip()
                ]
            }
        )

    return result


# ============================================================
# UPCOMING EXAMS
# ============================================================

def get_upcoming_exams(
    exams: List[Dict]
) -> List[Dict]:

    today = date.today()

    result = []

    seen = set()

    for exam in exams:

        if exam.get(
            "completed",
            False
        ):
            continue

        status = str(
            exam.get(
                "status",
                ""
            )
        ).lower()

        if status in (
            "completed",
            "cancelled"
        ):
            continue

        exam_date = record_date(
            exam,
            "exam_date",
            "date",
            "scheduled_date"
        )

        if not exam_date:
            continue

        if exam_date < today:
            continue

        exam_id = str(
            exam.get(
                "exam_id",
                ""
            )
        ).strip().upper()

        exam_name = str(
            exam.get(
                "exam_name",
                exam.get(
                    "name",
                    ""
                )
            )
        ).strip().lower()

        subject = str(
            exam.get(
                "subject",
                ""
            )
        ).strip().lower()

        if exam_id:

            unique_key = (
                "id",
                exam_id
            )

        else:

            unique_key = (
                "details",
                exam_name,
                subject,
                exam_date.isoformat()
            )

        if unique_key in seen:
            continue

        seen.add(
            unique_key
        )

        result.append(
            exam
        )

    result.sort(
        key=lambda exam:
        record_date(
            exam,
            "exam_date",
            "date",
            "scheduled_date"
        ) or date.max
    )

    return result


# ============================================================
# PENDING ASSIGNMENTS
# ============================================================

def get_pending_assignments(
    assignments: List[Dict]
) -> List[Dict]:

    result = []

    for assignment in assignments:

        if assignment.get(
            "completed",
            False
        ):
            continue

        status = str(
            assignment.get(
                "status",
                ""
            )
        ).lower()

        if status in (
            "completed",
            "submitted",
            "done"
        ):
            continue

        result.append(
            assignment
        )

    result.sort(
        key=lambda assignment:
        record_date(
            assignment,
            "due_date",
            "deadline",
            "submission_date"
        ) or date.max
    )

    return result


# ============================================================
# SESSION FACTORY
# ============================================================

def create_session(
    session_date: date,
    title: str,
    subject: str,
    topic: str,
    duration: int,
    priority: str,
    reason: str,
    activity: str,
    category: str
) -> Dict:

    return {

        "session_id":
            "SESSION-"
            + uuid.uuid4().hex[:8].upper(),

        "date":
            session_date.isoformat(),

        "title":
            title,

        "subject":
            subject,

        "topic":
            topic,

        "duration_minutes":
            duration,

        "priority":
            priority,

        "reason":
            reason,

        "activity":
            activity,

        "category":
            category,

        "completed":
            False,

        "created_at":
            datetime.now().isoformat()
    }


# ============================================================
# SMART SESSION GENERATION
# ============================================================

def generate_sessions(
    edu_id: str,
    days: int,
    threshold: float
) -> Dict:

    exams = get_upcoming_exams(
        get_exams(
            edu_id
        )
    )

    assignments = get_pending_assignments(
        get_assignments(
            edu_id
        )
    )

    subjects = get_subjects(
        edu_id
    )

    performance = get_performance(
        edu_id
    )

    weak_topics = analyze_weak_topics(
        performance,
        threshold
    )

    subject_topics = get_subject_topics(
        subjects
    )

    today = date.today()

    sessions = []

    # ========================================================
    # WEAK TOPIC QUEUE
    # ========================================================

    weak_queue = []

    for weak in weak_topics:

        weak_queue.append(
            {
                "subject":
                    weak["subject"],

                "topic":
                    weak["topic"],

                "percentage":
                    weak["percentage"],

                "priority":
                    weak["priority"]
            }
        )


    # ========================================================
    # EXAM QUEUE
    # ========================================================

    exam_queue = []

    for exam in exams:

        exam_subject = (
            exam.get(
                "subject"
            )
            or ""
        ).strip()

        exam_name = (
            exam.get(
                "exam_name"
            )
            or exam.get(
                "name"
            )
            or "Upcoming Exam"
        )

        exam_date = record_date(
            exam,
            "exam_date",
            "date",
            "scheduled_date"
        )

        if exam_date:

            days_until = (
                exam_date
                - today
            ).days

        else:

            days_until = 999

        exam_queue.append(
            {
                "subject":
                    exam_subject,

                "exam_name":
                    exam_name,

                "exam_date":
                    exam_date,

                "days_until":
                    days_until
            }
        )


    # ========================================================
    # ACTIVITY PATTERNS
    # ========================================================

    activity_patterns = [

        (
            "Concept Review",
            "Review core concepts and create short revision notes.",
            "concept_review"
        ),

        (
            "Practice Questions",
            "Solve practice questions and check mistakes.",
            "practice"
        ),

        (
            "Deep Practice",
            "Work through application-based and problem-solving questions.",
            "deep_practice"
        ),

        (
            "Revision",
            "Revise important concepts and previously studied material.",
            "revision"
        ),

        (
            "Mock Assessment",
            "Complete a short mock test and analyse incorrect answers.",
            "mock_test"
        ),

        (
            "Active Recall",
            "Use active recall to test understanding without looking at notes.",
            "active_recall"
        ),

        (
            "Final Review",
            "Review key concepts, mistakes and important questions.",
            "final_review"
        )
    ]


    # ========================================================
    # ASSIGNMENT DAYS
    #
    # Only the final 1–2 days before the deadline receive
    # dedicated assignment sessions.
    # ========================================================

    assignment_days = {}

    for assignment in assignments:

        due_date = record_date(
            assignment,
            "due_date",
            "deadline",
            "submission_date"
        )

        if not due_date:
            continue

        for offset in (
            1,
            0
        ):

            target_date = (
                due_date
                - timedelta(
                    days=offset
                )
            )

            if (
                target_date >= today
                and target_date <
                today + timedelta(
                    days=days
                )
            ):

                assignment_days[
                    target_date.isoformat()
                ] = assignment


    # ========================================================
    # CREATE DAILY SESSIONS
    # ========================================================

    for day_index in range(
        days
    ):

        session_date = (
            today
            + timedelta(
                days=day_index
            )
        )

        date_key = session_date.isoformat()

        pattern = activity_patterns[
            day_index
            % len(
                activity_patterns
            )
        ]

        activity_name = pattern[0]

        activity_description = pattern[1]

        category = pattern[2]


        # ====================================================
        # ASSIGNMENT HAS DEADLINE PRIORITY
        # ====================================================

        assignment_for_day = (
            assignment_days.get(
                date_key
            )
        )

        if assignment_for_day:

            assignment_title = (
                assignment_for_day.get(
                    "title"
                )
                or assignment_for_day.get(
                    "assignment_name"
                )
                or "Pending Assignment"
            )

            assignment_subject = (
                assignment_for_day.get(
                    "subject"
                )
                or "General"
            )

            due_date = record_date(
                assignment_for_day,
                "due_date",
                "deadline",
                "submission_date"
            )

            title = (
                "Assignment Preparation — "
                f"{assignment_title}"
            )

            subject = assignment_subject

            topic = "Assignment Preparation"

            priority = "high"

            duration = 90

            reason = (
                f"Assignment deadline is "
                f"{due_date.isoformat() if due_date else 'approaching'}."
            )

            activity = (
                "Complete the assignment work, "
                "review the requirements, "
                "check your answers, "
                "and prepare the final submission."
            )

            session = create_session(
                session_date=session_date,
                title=title,
                subject=subject,
                topic=topic,
                duration=duration,
                priority=priority,
                reason=reason,
                activity=activity,
                category="assignment"
            )

            sessions.append(
                session
            )

            continue


        # ====================================================
        # EXAM PREPARATION
        # ====================================================

        exam_focus = None

        for exam in exam_queue:

            if (
                exam["exam_date"]
                and
                exam["days_until"] <= 14
            ):

                exam_focus = exam
                break


        # ====================================================
        # WEAK TOPIC FOCUS
        # ====================================================

        if weak_queue:

            # Keep weak topic as the main focus,
            # but rotate activity rather than content.

            focus_index = (
                day_index
                % len(
                    weak_queue
                )
            )

            focus = weak_queue[
                focus_index
            ]

            subject = focus[
                "subject"
            ]

            topic = focus[
                "topic"
            ]

            percentage = focus[
                "percentage"
            ]

            priority = focus[
                "priority"
            ]

            title = (
                f"{activity_name} — "
                f"{topic}"
            )

            reason = (
                f"Current performance: "
                f"{float(percentage):.1f}%"
            )

            duration = (
                90
                if priority == "high"
                else 75
                if priority == "medium-high"
                else 60
            )


        # ====================================================
        # EXAM FOCUS
        # ====================================================

        elif exam_focus:

            subject = (
                exam_focus["subject"]
                or "General Revision"
            )

            topic = (
                "Exam Preparation"
            )

            title = (
                f"{activity_name} — "
                f"{subject}"
            )

            priority = (
                "high"
                if exam_focus[
                    "days_until"
                ] <= 7
                else "medium"
            )

            reason = (
                f"Upcoming "
                f"{exam_focus['exam_name']} "
                f"requires preparation."
            )

            duration = (
                90
                if priority == "high"
                else 60
            )


        # ====================================================
        # SUBJECT FOCUS
        # ====================================================

        elif subject_topics:

            subject_index = (
                day_index
                % len(
                    subject_topics
                )
            )

            subject_data = (
                subject_topics[
                    subject_index
                ]
            )

            subject = subject_data[
                "subject"
            ]

            topics = subject_data[
                "topics"
            ]

            if topics:

                topic_index = (
                    day_index
                    % len(
                        topics
                    )
                )

                topic = topics[
                    topic_index
                ]

            else:

                topic = "General Revision"

            title = (
                f"{activity_name} — "
                f"{subject}"
            )

            priority = "medium"

            reason = (
                "Balanced learning based on "
                "your saved subjects."
            )

            duration = 60


        # ====================================================
        # GENERAL LEARNING
        # ====================================================

        else:

            subject = (
                "General Learning"
            )

            topic = (
                "General Revision"
            )

            title = (
                f"{activity_name} — "
                f"{subject}"
            )

            priority = "medium"

            reason = (
                "General learning and revision "
                "session."
            )

            duration = 60


        # ====================================================
        # EXAM CONNECTION
        # ====================================================

        if (
            exam_focus
            and
            subject.lower()
            == exam_focus[
                "subject"
            ].lower()
        ):

            reason += (
                f" This also supports preparation "
                f"for {exam_focus['exam_name']}."
            )


        # ====================================================
        # CREATE SESSION
        # ====================================================

        session = create_session(
            session_date=session_date,
            title=title,
            subject=subject,
            topic=topic,
            duration=duration,
            priority=priority,
            reason=reason,
            activity=activity_description,
            category=category
        )

        sessions.append(
            session
        )


    return {

        "sessions":
            sessions,

        "weak_topics":
            weak_topics,

        "upcoming_exams":
            exams,

        "pending_assignments":
            assignments,

        "subjects":
            subjects
    }


# ============================================================
# SAVE PLAN
# ============================================================

def save_plan(
    plan: Dict
) -> bool:

    existing = normalize_list(
        load_json(
            STUDY_PLANS_FILE,
            []
        )
    )

    existing.append(
        plan
    )

    return save_json(
        STUDY_PLANS_FILE,
        existing
    )


# ============================================================
# GET PLANS
# ============================================================

def get_plans(
    edu_id: str
) -> List[Dict]:

    return find_by_edu_id(
        load_json(
            STUDY_PLANS_FILE,
            []
        ),
        edu_id
    )


# ============================================================
# LATEST PLAN
# ============================================================

def get_latest_plan(
    plans: List[Dict]
) -> Optional[Dict]:

    if not plans:
        return None

    plans = sorted(
        plans,
        key=lambda plan:
        plan.get(
            "generated_at",
            ""
        ),
        reverse=True
    )

    return plans[0]


# ============================================================
# GENERATE STUDY PLAN
# ============================================================

@router.post(
    "/generate"
)
def generate_study_plan(
    request: StudyPlanGenerateRequest
):

    edu_id = request.edu_id.strip()

    if not edu_id:

        raise HTTPException(
            status_code=400,
            detail="EDU ID is required."
        )

    result = generate_sessions(
        edu_id=edu_id,
        days=request.days,
        threshold=request.threshold
    )

    sessions = result[
        "sessions"
    ]

    total_minutes = sum(
        int(
            session.get(
                "duration_minutes",
                0
            )
            or 0
        )
        for session in sessions
    )

    plan = {

        "plan_id":
            "PLAN-"
            + uuid.uuid4().hex[:8].upper(),

        "edu_id":
            edu_id,

        "duration_days":
            request.days,

        "threshold":
            request.threshold,

        "generated_at":
            datetime.now().isoformat(),

        "total_sessions":
            len(sessions),

        "total_minutes":
            total_minutes,

        "sessions":
            sessions,

        "weak_topics":
            result[
                "weak_topics"
            ],

        "upcoming_exams":
            result[
                "upcoming_exams"
            ],

        "pending_assignments":
            result[
                "pending_assignments"
            ],

        "subjects":
            result[
                "subjects"
            ]
    }

    saved = save_plan(
        plan
    )

    if not saved:

        raise HTTPException(
            status_code=500,
            detail=(
                "Study plan was generated "
                "but could not be saved."
            )
        )

    return {

        "success":
            True,

        "message":
            "Smart Study Plan generated successfully.",

        "plan":
            plan
    }


# ============================================================
# GET ALL PLANS
# ============================================================

@router.get(
    "/{edu_id}"
)
def get_study_plans(
    edu_id: str
):

    plans = get_plans(
        edu_id
    )

    return {

        "success":
            True,

        "edu_id":
            edu_id,

        "count":
            len(plans),

        "plans":
            plans
    }


# ============================================================
# GET LATEST PLAN
# ============================================================

@router.get(
    "/{edu_id}/latest"
)
def get_latest_study_plan(
    edu_id: str
):

    plans = get_plans(
        edu_id
    )

    latest = get_latest_plan(
        plans
    )

    if not latest:

        return {

            "success":
                True,

            "edu_id":
                edu_id,

            "study_plan_available":
                False,

            "plan":
                None
        }

    return {

        "success":
            True,

        "edu_id":
            edu_id,

        "study_plan_available":
            True,

        "plan":
            latest
    }


# ============================================================
# COMPLETE STUDY SESSION
# ============================================================

@router.patch(
    "/session/{session_id}/complete"
)
def complete_session(
    session_id: str
):

    plans = normalize_list(
        load_json(
            STUDY_PLANS_FILE,
            []
        )
    )

    found = False

    updated_session = None

    for plan in plans:

        sessions = plan.get(
            "sessions",
            []
        )

        if not isinstance(
            sessions,
            list
        ):
            continue

        for session in sessions:

            if (
                session.get(
                    "session_id"
                )
                == session_id
            ):

                session[
                    "completed"
                ] = True

                session[
                    "completed_at"
                ] = (
                    datetime.now().isoformat()
                )

                updated_session = (
                    session
                )

                found = True

                break

        if found:
            break

    if not found:

        raise HTTPException(
            status_code=404,
            detail="Study session not found."
        )

    saved = save_json(
        STUDY_PLANS_FILE,
        plans
    )

    if not saved:

        raise HTTPException(
            status_code=500,
            detail=(
                "Session was updated "
                "but could not be saved."
            )
        )

    return {

        "success":
            True,

        "message":
            "Study session marked as completed.",

        "session":
            updated_session
    }