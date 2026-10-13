import json
import os
from collections import defaultdict


BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)

DATA_DIR = os.path.join(BASE_DIR, "data", "users")
PERFORMANCE_FILE = os.path.join(DATA_DIR, "performance.json")


def load_performance():
    os.makedirs(DATA_DIR, exist_ok=True)

    if not os.path.exists(PERFORMANCE_FILE):
        return []

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


def analyze_weak_topics(
    edu_id: str,
    threshold: float = 60
):
    records = load_performance()

    user_records = [
        record
        for record in records
        if record.get("edu_id") == edu_id
    ]

    topic_groups = defaultdict(
        lambda: {
            "subject": "",
            "topic": "",
            "total_marks_obtained": 0,
            "total_maximum_marks": 0,
            "assessment_count": 0
        }
    )

    for record in user_records:

        topic = record.get("topic", "").strip()

        if not topic:
            continue

        key = (
            record.get("subject", "Unknown"),
            topic
        )

        topic_groups[key]["subject"] = (
            record.get("subject", "Unknown")
        )

        topic_groups[key]["topic"] = topic

        topic_groups[key][
            "total_marks_obtained"
        ] += record.get("marks_obtained", 0)

        topic_groups[key][
            "total_maximum_marks"
        ] += record.get("maximum_marks", 0)

        topic_groups[key][
            "assessment_count"
        ] += 1

    weak_topics = []

    for topic_data in topic_groups.values():

        maximum = topic_data[
            "total_maximum_marks"
        ]

        obtained = topic_data[
            "total_marks_obtained"
        ]

        if maximum <= 0:
            continue

        percentage = round(
            (obtained / maximum) * 100,
            2
        )

        if percentage < threshold:

            if percentage < 40:
                priority = "high"

            elif percentage < 50:
                priority = "medium-high"

            else:
                priority = "medium"

            weak_topics.append({
                "subject": topic_data["subject"],
                "topic": topic_data["topic"],
                "percentage": percentage,
                "assessment_count": topic_data[
                    "assessment_count"
                ],
                "priority": priority
            })

    weak_topics.sort(
        key=lambda item: item["percentage"]
    )

    return weak_topics


def generate_recommendation(topic):
    percentage = topic["percentage"]
    topic_name = topic["topic"]
    priority = topic["priority"]

    if percentage < 40:
        return (
            f"Focus strongly on {topic_name}. "
            f"Review the fundamentals first, then practice "
            f"basic problems before moving to advanced questions."
        )

    if percentage < 50:
        return (
            f"Spend additional study time on {topic_name}. "
            f"Revise the core concepts and complete "
            f"practice exercises regularly."
        )

    return (
        f"Practice {topic_name} more frequently. "
        f"Review mistakes from previous assessments "
        f"and solve additional questions."
    )


def generate_study_recommendations(
    edu_id: str,
    threshold: float = 60
):
    weak_topics = analyze_weak_topics(
        edu_id,
        threshold
    )

    recommendations = []

    for topic in weak_topics:

        recommendations.append({
            "subject": topic["subject"],
            "topic": topic["topic"],
            "current_percentage": topic["percentage"],
            "priority": topic["priority"],
            "recommendation": generate_recommendation(
                topic
            )
        })

    return recommendations


def analyze_subject_performance(edu_id: str):
    records = load_performance()

    user_records = [
        record
        for record in records
        if record.get("edu_id") == edu_id
    ]

    subject_groups = defaultdict(
        lambda: {
            "subject": "",
            "marks_obtained": 0,
            "maximum_marks": 0,
            "assessment_count": 0
        }
    )

    for record in user_records:

        subject = record.get(
            "subject",
            "Unknown"
        )

        subject_groups[subject]["subject"] = subject

        subject_groups[subject][
            "marks_obtained"
        ] += record.get(
            "marks_obtained",
            0
        )

        subject_groups[subject][
            "maximum_marks"
        ] += record.get(
            "maximum_marks",
            0
        )

        subject_groups[subject][
            "assessment_count"
        ] += 1

    subjects = []

    for subject_data in subject_groups.values():

        maximum = subject_data["maximum_marks"]

        if maximum <= 0:
            continue

        percentage = round(
            (
                subject_data["marks_obtained"]
                / maximum
            ) * 100,
            2
        )

        if percentage >= 85:
            level = "excellent"
        elif percentage >= 70:
            level = "good"
        elif percentage >= 50:
            level = "average"
        else:
            level = "needs_improvement"

        subjects.append({
            "subject": subject_data["subject"],
            "marks_obtained": subject_data[
                "marks_obtained"
            ],
            "maximum_marks": maximum,
            "percentage": percentage,
            "assessment_count": subject_data[
                "assessment_count"
            ],
            "performance_level": level
        })

    subjects.sort(
        key=lambda item: item["percentage"]
    )

    return subjects


def generate_overall_recommendation(
    edu_id: str
):
    subjects = analyze_subject_performance(
        edu_id
    )

    weak_topics = analyze_weak_topics(
        edu_id
    )

    if not subjects:
        return {
            "message": (
                "Add exam, assignment or quiz marks "
                "to generate personalized recommendations."
            ),
            "focus_subjects": [],
            "focus_topics": []
        }

    focus_subjects = [
        subject
        for subject in subjects
        if subject["percentage"] < 60
    ]

    focus_topics = weak_topics[:5]

    if focus_subjects:
        message = (
            "Prioritize the subjects with lower scores "
            "and combine concept revision with practice questions."
        )

    elif weak_topics:
        message = (
            "Overall performance is progressing well. "
            "Focus your additional study time on the identified "
            "weak topics."
        )

    else:
        message = (
            "No major weak areas were identified from the "
            "available performance records. Continue regular "
            "revision and practice."
        )

    return {
        "message": message,
        "focus_subjects": focus_subjects,
        "focus_topics": focus_topics
    }