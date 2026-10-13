from __future__ import annotations

import hashlib
import random
from datetime import datetime
from typing import Any, Dict, List, Optional


# ============================================================
# GAME TYPES
# ============================================================

GAME_AI_DETECTIVE = "ai_detective"
GAME_AI_SWITCH = "ai_switch"
GAME_AI_VS_YOU = "ai_vs_you"

SUPPORTED_GAMES = {
    GAME_AI_DETECTIVE,
    GAME_AI_SWITCH,
    GAME_AI_VS_YOU,
}


# ============================================================
# USER TYPES
# ============================================================

USER_STUDENT = "student"
USER_WORKING_PROFESSIONAL = "working_professional"
USER_GENERAL = "general"

SUPPORTED_USER_TYPES = {
    USER_STUDENT,
    USER_WORKING_PROFESSIONAL,
    USER_GENERAL,
}


# ============================================================
# DIFFICULTY
# ============================================================

DIFFICULTY_LEVELS = {
    1: "easy",
    2: "medium",
    3: "hard",
    4: "expert",
}


# ============================================================
# THINKING SKILLS
# ============================================================

THINKING_SKILLS = [
    "logic",
    "observation",
    "problem_solving",
    "decision_making",
    "creativity",
    "risk_awareness",
    "planning",
]


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def normalize_text(value: Any) -> str:
    """
    Convert a value into normalized lowercase text.
    """

    if value is None:
        return ""

    return " ".join(
        str(value)
        .strip()
        .lower()
        .split()
    )


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    """
    Keep a numeric value inside a defined range.
    """

    return max(
        minimum,
        min(
            maximum,
            value,
        ),
    )


def safe_int(
    value: Any,
    default: int = 0,
) -> int:
    """
    Safely convert a value to integer.
    """

    try:
        return int(value)

    except (
        TypeError,
        ValueError,
    ):
        return default


def safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Safely convert a value to float.
    """

    try:
        return float(value)

    except (
        TypeError,
        ValueError,
    ):
        return default


def generate_game_id() -> str:
    """
    Generate a unique game ID.
    """

    seed = (
        f"GAME|"
        f"{datetime.utcnow().isoformat()}|"
        f"{random.random()}"
    )

    return (
        "GAME-"
        + hashlib.sha256(
            seed.encode("utf-8")
        ).hexdigest()[:10].upper()
    )


def generate_challenge_id() -> str:
    """
    Generate a unique challenge ID.
    """

    seed = (
        f"CHALLENGE|"
        f"{datetime.utcnow().isoformat()}|"
        f"{random.random()}"
    )

    return (
        "CH-"
        + hashlib.sha256(
            seed.encode("utf-8")
        ).hexdigest()[:8].upper()
    )


# ============================================================
# SKILL NORMALIZATION
# ============================================================

def normalize_skill_name(
    skill: Any,
) -> str:
    """
    Normalize skill names.

    Compatibility:
    Older game results may contain 'decision'.
    New system uses 'decision_making'.
    """

    value = normalize_text(
        skill
    )

    aliases = {
        "decision": "decision_making",
        "decision making": "decision_making",
        "decision-making": "decision_making",
        "problem solving": "problem_solving",
        "problem-solving": "problem_solving",
        "risk awareness": "risk_awareness",
        "risk-awareness": "risk_awareness",
    }

    return aliases.get(
        value,
        value,
    )


def normalize_skill_scores(
    skills: Any,
) -> Dict[str, int]:
    """
    Convert skill information into a consistent dictionary.

    Supports:

        {
            "logic": 25,
            "observation": 25
        }

    and:

        [
            "logic",
            "observation"
        ]
    """

    normalized: Dict[str, int] = {
        skill: 0
        for skill in THINKING_SKILLS
    }

    if isinstance(
        skills,
        dict,
    ):

        for raw_skill, raw_score in skills.items():

            skill = normalize_skill_name(
                raw_skill
            )

            if skill not in normalized:
                continue

            normalized[skill] = int(
                clamp(
                    safe_float(
                        raw_score
                    ),
                    0,
                    100,
                )
            )

        return normalized

    if isinstance(
        skills,
        list,
    ):

        valid_skills = []

        for item in skills:

            skill = normalize_skill_name(
                item
            )

            if skill in normalized:
                valid_skills.append(
                    skill
                )

        # Remove duplicates while preserving order.
        valid_skills = list(
            dict.fromkeys(
                valid_skills
            )
        )

        if valid_skills:

            share = int(
                100 / len(valid_skills)
            )

            for skill in valid_skills:
                normalized[skill] = share

        return normalized

    return normalized


# ============================================================
# USER PROFILE
# ============================================================

def normalize_user_type(
    user_type: Any,
) -> str:
    """
    Normalize user type.
    """

    value = normalize_text(
        user_type
    )

    aliases = {
        "student": USER_STUDENT,
        "college student": USER_STUDENT,
        "working": USER_WORKING_PROFESSIONAL,
        "working professional": USER_WORKING_PROFESSIONAL,
        "professional": USER_WORKING_PROFESSIONAL,
        "general": USER_GENERAL,
        "other": USER_GENERAL,
    }

    return aliases.get(
        value,
        USER_GENERAL,
    )


def calculate_adaptive_difficulty(
    average_score: float = 0,
    recent_scores: Optional[
        List[float]
    ] = None,
) -> Dict[str, Any]:
    """
    Calculate the next recommended difficulty.
    """

    scores = recent_scores or []

    if scores:

        average_score = (
            sum(
                clamp(
                    safe_float(
                        score
                    ),
                    0,
                    100,
                )
                for score in scores
            )
            / len(scores)
        )

    average_score = clamp(
        safe_float(
            average_score
        ),
        0,
        100,
    )

    if average_score >= 90:

        level = 4

        reason = (
            "Recent performance is excellent. "
            "An expert challenge is appropriate."
        )

    elif average_score >= 75:

        level = 4

        reason = (
            "Recent performance is strong. "
            "A harder challenge is appropriate."
        )

    elif average_score >= 60:

        level = 3

        reason = (
            "Performance is developing well. "
            "A hard challenge can provide useful practice."
        )

    elif average_score >= 40:

        level = 2

        reason = (
            "Performance is still developing. "
            "A medium challenge is appropriate."
        )

    else:

        level = 1

        reason = (
            "A foundational challenge is recommended "
            "to build confidence."
        )

    return {
        "level": level,
        "difficulty": DIFFICULTY_LEVELS[level],
        "average_score": round(
            average_score,
            2,
        ),
        "reason": reason,
    }


# ============================================================
# USER CONTEXT
# ============================================================

def get_user_context(
    user_type: str,
    profile: Optional[
        Dict[str, Any]
    ] = None,
) -> Dict[str, Any]:
    """
    Build game context based on user type.
    """

    normalized_type = normalize_user_type(
        user_type
    )

    profile = profile or {}

    default_domains = {

        USER_STUDENT: [
            "education",
            "technology",
            "data",
            "science",
            "reasoning",
        ],

        USER_WORKING_PROFESSIONAL: [
            "work",
            "technology",
            "projects",
            "planning",
            "decision_making",
        ],

        USER_GENERAL: [
            "everyday reasoning",
            "technology",
            "planning",
            "problem_solving",
            "decision_making",
        ],
    }

    interests = profile.get(
        "interests",
        [],
    )

    if isinstance(
        interests,
        str,
    ):

        interests = [
            interests
        ]

    return {
        "user_type": normalized_type,

        "domains": default_domains.get(
            normalized_type,
            default_domains[
                USER_GENERAL
            ],
        ),

        "subjects": profile.get(
            "subjects",
            [],
        ),

        "interests": interests,

        "occupation": profile.get(
            "occupation",
            "",
        ),
    }


# ============================================================
# AI DETECTIVE CASES
# ============================================================

AI_DETECTIVE_CASES = [

    {
        "title": "The Missing Deployment",
        "category": "technology",
        "difficulty": 1,

        "story": (
            "A software team deployed a new application. "
            "The deployment dashboard says everything succeeded, "
            "but users report that the new feature is missing."
        ),

        "clues": [

            {
                "id": "D1",
                "title": "Deployment Log",
                "text": (
                    "The deployment pipeline completed successfully."
                ),
            },

            {
                "id": "D2",
                "title": "Server Version",
                "text": (
                    "The production server is still running "
                    "an older application version."
                ),
            },

            {
                "id": "D3",
                "title": "User Report",
                "text": (
                    "Users cannot see the newly developed feature."
                ),
            },
        ],

        "question": (
            "What is the most likely issue?"
        ),

        "options": [

            {
                "id": "A",
                "text": (
                    "The new version was not actually running "
                    "on the production server."
                ),
                "correct": True,
            },

            {
                "id": "B",
                "text": (
                    "Users automatically deleted the feature."
                ),
                "correct": False,
            },

            {
                "id": "C",
                "text": (
                    "The dashboard is generating random results."
                ),
                "correct": False,
            },
        ],

        "answer": "A",

        "explanation": (
            "The deployment pipeline succeeded, but the production "
            "server is still running the older version."
        ),

        "skills": [
            "observation",
            "logic",
            "problem_solving",
        ],
    },


    {
        "title": "The Suspicious Dataset",
        "category": "data",
        "difficulty": 2,

        "story": (
            "A machine learning model suddenly reaches extremely "
            "high validation accuracy after a dataset update."
        ),

        "clues": [

            {
                "id": "D1",
                "title": "Dataset",
                "text": (
                    "Some records appear in both the training "
                    "and validation datasets."
                ),
            },

            {
                "id": "D2",
                "title": "Validation",
                "text": (
                    "Validation accuracy increased sharply "
                    "after the update."
                ),
            },

            {
                "id": "D3",
                "title": "Real World Test",
                "text": (
                    "Performance is much lower on completely "
                    "new data."
                ),
            },
        ],

        "question": (
            "What is the most likely explanation?"
        ),

        "options": [

            {
                "id": "A",
                "text": (
                    "Data leakage caused an overly optimistic "
                    "validation result."
                ),
                "correct": True,
            },

            {
                "id": "B",
                "text": (
                    "The model became perfectly generalized."
                ),
                "correct": False,
            },

            {
                "id": "C",
                "text": (
                    "The processor automatically improved accuracy."
                ),
                "correct": False,
            },
        ],

        "answer": "A",

        "explanation": (
            "Data appearing in both training and validation "
            "can leak information and make validation accuracy "
            "look much better than real-world performance."
        ),

        "skills": [
            "observation",
            "logic",
            "problem_solving",
            "risk_awareness",
        ],
    },


    {
        "title": "The Impossible Timeline",
        "category": "reasoning",
        "difficulty": 3,

        "story": (
            "A project report claims that three dependent tasks "
            "were completed before their required inputs were available."
        ),

        "clues": [

            {
                "id": "D1",
                "title": "Task A",
                "text": (
                    "Task A produced the dataset required by Task B."
                ),
            },

            {
                "id": "D2",
                "title": "Task B",
                "text": (
                    "Task B is recorded as completed before Task A."
                ),
            },

            {
                "id": "D3",
                "title": "Task C",
                "text": (
                    "Task C depends on Task B and is also recorded "
                    "as completed before Task B."
                ),
            },
        ],

        "question": (
            "What should be investigated first?"
        ),

        "options": [

            {
                "id": "A",
                "text": (
                    "The project timeline or recorded completion dates."
                ),
                "correct": True,
            },

            {
                "id": "B",
                "text": (
                    "The color of the project dashboard."
                ),
                "correct": False,
            },

            {
                "id": "C",
                "text": (
                    "The names of the project members."
                ),
                "correct": False,
            },
        ],

        "answer": "A",

        "explanation": (
            "The dependency order is impossible based on the "
            "reported timeline, so the recorded dates should "
            "be investigated first."
        ),

        "skills": [
            "observation",
            "logic",
            "problem_solving",
            "risk_awareness",
        ],
    },
]


def get_detective_case(
    difficulty: int = 1,
) -> Dict[str, Any]:
    """
    Select an AI Detective case.
    """

    difficulty = safe_int(
        difficulty,
        1,
    )

    matching = [

        case
        for case in AI_DETECTIVE_CASES

        if safe_int(
            case.get(
                "difficulty",
                1,
            )
        ) <= difficulty
    ]

    if not matching:
        matching = AI_DETECTIVE_CASES

    return dict(
        random.choice(
            matching
        )
    )


# ============================================================
# FIXED AI DETECTIVE SCORING
# ============================================================

def score_detective(
    challenge: Dict[str, Any],
    answer: str,
) -> Dict[str, Any]:
    """
    Score AI Detective securely.

    Correct answer resolution order:

    1. challenge["answer"]
    2. challenge["_internal"]["answer"]
    3. option where correct=True

    This is important because the public game response
    intentionally removes hidden answer information.
    """

    selected = normalize_text(
        answer
    )

    # --------------------------------------------------------
    # 1. Try direct answer
    # --------------------------------------------------------

    correct_answer = normalize_text(
        challenge.get(
            "answer",
            "",
        )
    )

    # --------------------------------------------------------
    # 2. Try private internal answer
    # --------------------------------------------------------

    if not correct_answer:

        internal = challenge.get(
            "_internal",
            {},
        )

        if isinstance(
            internal,
            dict,
        ):

            correct_answer = normalize_text(
                internal.get(
                    "answer",
                    "",
                )
            )

    # --------------------------------------------------------
    # 3. Try correct=True option
    # --------------------------------------------------------

    if not correct_answer:

        options = challenge.get(
            "options",
            [],
        )

        if isinstance(
            options,
            list,
        ):

            for option in options:

                if not isinstance(
                    option,
                    dict,
                ):
                    continue

                if bool(
                    option.get(
                        "correct",
                        False,
                    )
                ):

                    correct_answer = normalize_text(
                        option.get(
                            "id",
                            "",
                        )
                    )

                    break

    # --------------------------------------------------------
    # 4. Compare
    # --------------------------------------------------------

    correct = (
        selected != ""
        and correct_answer != ""
        and selected == correct_answer
    )

    # --------------------------------------------------------
    # 5. Skills
    # --------------------------------------------------------

    skills = normalize_skill_scores(
        challenge.get(
            "skills",
            [],
        )
    )

    # --------------------------------------------------------
    # 6. Score
    # --------------------------------------------------------

    score = 100 if correct else 0

    # --------------------------------------------------------
    # 7. Explanation
    # --------------------------------------------------------

    explanation = challenge.get(
        "explanation",
        "",
    )

    if not explanation:

        internal = challenge.get(
            "_internal",
            {},
        )

        if isinstance(
            internal,
            dict,
        ):

            explanation = internal.get(
                "explanation",
                "",
            )

    return {
        "correct": correct,

        "score": score,

        "skill_scores": skills,

        "correct_answer": correct_answer,

        "explanation": explanation,
    }


# ============================================================
# AI SWITCH SCENARIOS
# ============================================================

AI_SWITCH_SCENARIOS = [

    {
        "title": "The Deadline Decision",
        "category": "project",
        "difficulty": 1,

        "story": (
            "A project deadline is tomorrow. One important feature "
            "is incomplete, but releasing the current version is possible."
        ),

        "situation": (
            "You must decide what to do before the deadline."
        ),

        "options": [

            {
                "id": "A",
                "text": (
                    "Release immediately without checking anything."
                ),
                "impact": "high_risk",
                "score": 25,
            },

            {
                "id": "B",
                "text": (
                    "Prioritize the critical feature, test it, "
                    "and communicate the remaining limitation."
                ),
                "impact": "balanced",
                "score": 100,
            },

            {
                "id": "C",
                "text": (
                    "Cancel the entire project."
                ),
                "impact": "high_cost",
                "score": 30,
            },
        ],

        "skills": [
            "decision_making",
            "risk_awareness",
            "planning",
        ],
    },


    {
        "title": "The Conflicting Priorities",
        "category": "planning",
        "difficulty": 2,

        "story": (
            "You have three important tasks due today. "
            "One affects customers, another affects an internal report, "
            "and the third is useful but not urgent."
        ),

        "situation": (
            "How should you prioritize the work?"
        ),

        "options": [

            {
                "id": "A",
                "text": (
                    "Complete the easiest task first."
                ),
                "impact": "low_priority",
                "score": 40,
            },

            {
                "id": "B",
                "text": (
                    "Handle the customer-impacting task first, "
                    "then the urgent internal work."
                ),
                "impact": "balanced",
                "score": 100,
            },

            {
                "id": "C",
                "text": (
                    "Work randomly on all three tasks."
                ),
                "impact": "inefficient",
                "score": 20,
            },
        ],

        "skills": [
            "decision_making",
            "planning",
            "risk_awareness",
        ],
    },
]


def get_switch_scenario(
    difficulty: int = 1,
) -> Dict[str, Any]:
    """
    Select an AI Switch scenario.
    """

    difficulty = safe_int(
        difficulty,
        1,
    )

    matching = [

        scenario
        for scenario in AI_SWITCH_SCENARIOS

        if safe_int(
            scenario.get(
                "difficulty",
                1,
            )
        ) <= difficulty
    ]

    if not matching:
        matching = AI_SWITCH_SCENARIOS

    return dict(
        random.choice(
            matching
        )
    )


def score_switch(
    challenge: Dict[str, Any],
    answer: str,
) -> Dict[str, Any]:
    """
    Score AI Switch.
    """

    selected = normalize_text(
        answer
    )

    options = challenge.get(
        "options",
        [],
    )

    selected_option = None

    for option in options:

        if normalize_text(
            option.get(
                "id",
                "",
            )
        ) == selected:

            selected_option = option
            break

    if selected_option is None:

        return {
            "correct": False,

            "score": 0,

            "skill_scores": normalize_skill_scores(
                challenge.get(
                    "skills",
                    [],
                )
            ),

            "correct_answer": "",

            "explanation": (
                "The selected option was not found."
            ),

            "impact": "",
        }

    score = safe_float(
        selected_option.get(
            "score",
            0,
        )
    )

    correct = score >= 80

    correct_answer = next(
        (
            option.get(
                "id",
                "",
            )

            for option in options

            if safe_float(
                option.get(
                    "score",
                    0,
                )
            ) >= 80
        ),
        "",
    )

    return {

        "correct": correct,

        "score": clamp(
            score,
            0,
            100,
        ),

        "skill_scores": normalize_skill_scores(
            challenge.get(
                "skills",
                [],
            )
        ),

        "correct_answer": correct_answer,

        "selected_option": selected_option.get(
            "id",
            "",
        ),

        "impact": selected_option.get(
            "impact",
            "",
        ),

        "explanation": (
            "Your decision was evaluated using its "
            "risk, planning and consequence profile."
        ),
    }


# ============================================================
# AI VS YOU CHALLENGES
# ============================================================

AI_VS_YOU_CHALLENGES = [

    {
        "title": "Pattern Breaker",
        "category": "logic",
        "difficulty": 1,

        "question": (
            "What number comes next? "
            "2, 6, 12, 20, 30, ?"
        ),

        "answer": "42",

        "ai_answer": "42",

        "explanation": (
            "The differences are 4, 6, 8, 10, so the next "
            "difference is 12. Therefore 30 + 12 = 42."
        ),

        "skills": [
            "logic",
            "problem_solving",
        ],
    },


    {
        "title": "Python Output Duel",
        "category": "technology",
        "difficulty": 2,

        "question": (
            "What is the output of: "
            "len([1, 2, 3])?"
        ),

        "answer": "3",

        "ai_answer": "3",

        "explanation": (
            "The list contains three elements, so len() returns 3."
        ),

        "skills": [
            "logic",
            "problem_solving",
        ],
    },


    {
        "title": "Risk Prediction Duel",
        "category": "decision",
        "difficulty": 3,

        "question": (
            "A project depends on one external service. "
            "There is no backup and the service has recently "
            "experienced outages. What should you investigate first?"
        ),

        "answer": "dependency",

        "ai_answer": "dependency",

        "explanation": (
            "The single external dependency creates a potential "
            "single point of failure. A backup or contingency "
            "strategy should be investigated."
        ),

        "skills": [
            "decision_making",
            "risk_awareness",
            "planning",
        ],
    },
]


def get_ai_vs_you_challenge(
    difficulty: int = 1,
) -> Dict[str, Any]:
    """
    Select an AI vs You challenge.
    """

    difficulty = safe_int(
        difficulty,
        1,
    )

    matching = [

        challenge
        for challenge in AI_VS_YOU_CHALLENGES

        if safe_int(
            challenge.get(
                "difficulty",
                1,
            )
        ) <= difficulty
    ]

    if not matching:
        matching = AI_VS_YOU_CHALLENGES

    return dict(
        random.choice(
            matching
        )
    )


def normalize_answer_for_comparison(
    answer: Any,
) -> str:
    """
    Normalize an answer for AI vs You comparison.
    """

    value = normalize_text(
        answer
    )

    value = value.replace(
        ".",
        "",
    )

    value = value.replace(
        ",",
        "",
    )

    return value


def score_ai_vs_you(
    challenge: Dict[str, Any],
    answer: str,
) -> Dict[str, Any]:
    """
    Score the user's answer against the expected answer.
    """

    user_answer = normalize_answer_for_comparison(
        answer
    )

    expected_answer = normalize_answer_for_comparison(
        challenge.get(
            "answer",
            "",
        )
    )

    ai_answer = normalize_answer_for_comparison(
        challenge.get(
            "ai_answer",
            expected_answer,
        )
    )

    correct = (
        user_answer == expected_answer
    )

    ai_match = (
        user_answer == ai_answer
    )

    score = 100 if correct else 0

    skills = normalize_skill_scores(
        challenge.get(
            "skills",
            [],
        )
    )

    return {

        "correct": correct,

        "score": score,

        "skill_scores": skills,

        "correct_answer": challenge.get(
            "answer",
            "",
        ),

        "selected_answer": answer,

        "ai_answer": challenge.get(
            "ai_answer",
            "",
        ),

        "ai_match": ai_match,

        "explanation": challenge.get(
            "explanation",
            "",
        ),
    }


# ============================================================
# XP SYSTEM
# ============================================================

def calculate_xp(
    score: float,
    difficulty: int = 1,
    time_taken_seconds: int = 0,
    clue_count: int = 0,
    reasoning_quality: Optional[int] = None,
    streak_bonus: int = 0,
) -> int:
    """
    Calculate XP from game performance.
    """

    score = clamp(
        safe_float(
            score
        ),
        0,
        100,
    )

    difficulty = safe_int(
        difficulty,
        1,
    )

    difficulty_multiplier = {
        1: 1.0,
        2: 1.2,
        3: 1.5,
        4: 2.0,
    }.get(
        difficulty,
        1.0,
    )

    base_xp = (
        score
        * difficulty_multiplier
    )

    speed_bonus = 0

    if (
        time_taken_seconds > 0
        and time_taken_seconds <= 30
        and score >= 80
    ):

        speed_bonus = 20

    clue_penalty = min(
        safe_int(
            clue_count
        ) * 5,
        25,
    )

    reasoning_bonus = 0

    if reasoning_quality is not None:

        reasoning_quality = safe_int(
            reasoning_quality
        )

        reasoning_bonus = int(
            clamp(
                reasoning_quality,
                0,
                100,
            )
            * 0.25
        )

    xp = (
        base_xp
        + speed_bonus
        + reasoning_bonus
        + safe_int(
            streak_bonus
        )
        - clue_penalty
    )

    if score <= 0:
        xp = 0

    return max(
        0,
        int(
            round(
                xp
            )
        ),
    )


# ============================================================
# LEVEL SYSTEM
# ============================================================

def calculate_level(
    total_xp: int,
) -> Dict[str, Any]:
    """
    Calculate user level from total XP.

    Level thresholds:

    Level 1 -> 0 XP
    Level 2 -> 250 XP
    Level 3 -> 600 XP
    Level 4 -> 1000 XP
    Level 5 -> 1500 XP
    """

    total_xp = max(
        0,
        safe_int(
            total_xp
        ),
    )

    level = 1

    current_threshold = 0

    next_threshold = 250

    while total_xp >= next_threshold:

        level += 1

        current_threshold = next_threshold

        next_threshold = (
            250
            + (
                (level - 1)
                * 350
            )
        )

    progress_range = (
        next_threshold
        - current_threshold
    )

    progress = (

        (
            total_xp
            - current_threshold
        )
        / progress_range
        * 100

        if progress_range > 0
        else 0
    )

    return {

        "level": level,

        "total_xp": total_xp,

        "current_level_xp": max(
            0,
            total_xp
            - current_threshold,
        ),

        "xp_to_next_level": max(
            0,
            next_threshold
            - total_xp,
        ),

        "next_level_threshold": next_threshold,

        "progress_percent": round(
            clamp(
                progress,
                0,
                100,
            ),
            2,
        ),
    }


# ============================================================
# THINKING PROFILE
# ============================================================

def empty_thinking_profile() -> Dict[str, int]:
    """
    Create an empty thinking profile.
    """

    return {
        skill: 0
        for skill in THINKING_SKILLS
    }


def update_thinking_profile(
    results: Optional[
        List[Dict[str, Any]]
    ] = None,
) -> Dict[str, int]:
    """
    Aggregate skill scores across game results.
    """

    records = results or []

    totals = {
        skill: 0
        for skill in THINKING_SKILLS
    }

    counts = {
        skill: 0
        for skill in THINKING_SKILLS
    }

    for record in records:

        skill_scores = record.get(
            "skill_scores",
            {},
        )

        if not isinstance(
            skill_scores,
            dict,
        ):
            continue

        for raw_skill, raw_score in skill_scores.items():

            skill = normalize_skill_name(
                raw_skill
            )

            if skill not in totals:
                continue

            score = clamp(
                safe_float(
                    raw_score
                ),
                0,
                100,
            )

            totals[skill] += score

            counts[skill] += 1

    profile = empty_thinking_profile()

    for skill in THINKING_SKILLS:

        if counts[skill] > 0:

            profile[skill] = int(
                round(
                    totals[skill]
                    / counts[skill]
                )
            )

        else:

            profile[skill] = 0

    return profile


# ============================================================
# GENERATE GAME
# ============================================================

def generate_game(
    game_type: str,
    user_type: str = USER_GENERAL,
    difficulty: int = 1,
    profile: Optional[
        Dict[str, Any]
    ] = None,
    recent_results: Optional[
        List[Dict[str, Any]]
    ] = None,
) -> Dict[str, Any]:
    """
    Generate a complete game challenge.
    """

    game_type = normalize_text(
        game_type
    )

    if game_type not in SUPPORTED_GAMES:

        raise ValueError(
            f"Unsupported game type: {game_type}"
        )

    user_type = normalize_user_type(
        user_type
    )

    difficulty = safe_int(
        difficulty,
        1,
    )

    difficulty = int(
        clamp(
            difficulty,
            1,
            4,
        )
    )

    profile = profile or {}

    recent_results = recent_results or []

    scores = [

        safe_float(
            result.get(
                "score",
                0,
            )
        )

        for result in recent_results
    ]

    adaptive_difficulty = calculate_adaptive_difficulty(
        average_score=(
            sum(scores)
            / len(scores)
            if scores
            else 0
        ),
        recent_scores=scores,
    )

    user_context = get_user_context(
        user_type,
        profile,
    )

    if difficulty <= 0:

        difficulty = adaptive_difficulty[
            "level"
        ]

    if game_type == GAME_AI_DETECTIVE:

        base = get_detective_case(
            difficulty
        )

        game_name = "AI Detective"

        tagline = "Find what others missed."

    elif game_type == GAME_AI_SWITCH:

        base = get_switch_scenario(
            difficulty
        )

        game_name = "AI Switch"

        tagline = "You control the situation."

    else:

        base = get_ai_vs_you_challenge(
            difficulty
        )

        game_name = "AI vs You"

        tagline = "Can you outsmart the AI?"

    game = {

        "game_id": generate_game_id(),

        "challenge_id": generate_challenge_id(),

        "game_type": game_type,

        "game_name": game_name,

        "tagline": tagline,

        "user_type": user_type,

        "difficulty": {

            "level": difficulty,

            "difficulty": DIFFICULTY_LEVELS[
                difficulty
            ],

            "average_score": adaptive_difficulty[
                "average_score"
            ],

            "reason": adaptive_difficulty[
                "reason"
            ],
        },

        "category": base.get(
            "category",
            "general",
        ),

        "title": base.get(
            "title",
            "Untitled Challenge",
        ),

        "story": base.get(
            "story",
            "",
        ),

        "situation": base.get(
            "situation",
            "",
        ),

        "clues": base.get(
            "clues",
            [],
        ),

        "question": base.get(
            "question",
            "",
        ),

        "options": base.get(
            "options",
            [],
        ),

        "skills": base.get(
            "skills",
            [],
        ),

        "personalization": {

            "subjects": user_context.get(
                "subjects",
                [],
            ),

            "interests": user_context.get(
                "interests",
                [],
            ),

            "domains": user_context.get(
                "domains",
                [],
            ),
        },

        "started_at": datetime.utcnow().isoformat(),

        # ----------------------------------------------------
        # PRIVATE ANSWERS
        # ----------------------------------------------------
        #
        # games.py must remove this before returning the
        # challenge to the frontend.
        #
        "_internal": {

            "answer": base.get(
                "answer",
                "",
            ),

            "explanation": base.get(
                "explanation",
                "",
            ),

            "ai_answer": base.get(
                "ai_answer",
                "",
            ),
        },
    }

    return game


# ============================================================
# EVALUATE GAME
# ============================================================

def evaluate_game(
    game_type: str,
    challenge: Dict[str, Any],
    answer: str,
    time_taken_seconds: int = 0,
    clue_count: int = 0,
    reasoning_quality: Optional[int] = None,
    streak_bonus: int = 0,
) -> Dict[str, Any]:
    """
    Evaluate a submitted game answer.
    """

    game_type = normalize_text(
        game_type
    )

    if game_type == GAME_AI_DETECTIVE:

        evaluation = score_detective(
            challenge,
            answer,
        )

    elif game_type == GAME_AI_SWITCH:

        evaluation = score_switch(
            challenge,
            answer,
        )

    elif game_type == GAME_AI_VS_YOU:

        evaluation = score_ai_vs_you(
            challenge,
            answer,
        )

    else:

        raise ValueError(
            f"Unsupported game type: {game_type}"
        )

    difficulty_data = challenge.get(
        "difficulty",
        1,
    )

    if isinstance(
        difficulty_data,
        dict,
    ):

        difficulty = safe_int(
            difficulty_data.get(
                "level",
                1,
            ),
            1,
        )

    else:

        difficulty = safe_int(
            difficulty_data,
            1,
        )

    xp = calculate_xp(
        score=evaluation.get(
            "score",
            0,
        ),

        difficulty=difficulty,

        time_taken_seconds=time_taken_seconds,

        clue_count=clue_count,

        reasoning_quality=reasoning_quality,

        streak_bonus=streak_bonus,
    )

    evaluation[
        "time_taken_seconds"
    ] = safe_int(
        time_taken_seconds
    )

    evaluation[
        "clue_count"
    ] = safe_int(
        clue_count
    )

    evaluation[
        "reasoning_quality"
    ] = (

        safe_int(
            reasoning_quality
        )

        if reasoning_quality is not None

        else None
    )

    evaluation[
        "streak_bonus"
    ] = safe_int(
        streak_bonus
    )

    evaluation[
        "xp"
    ] = xp

    evaluation[
        "skill_scores"
    ] = normalize_skill_scores(
        evaluation.get(
            "skill_scores",
            challenge.get(
                "skills",
                [],
            ),
        )
    )

    return evaluation


# ============================================================
# DAILY MYSTERIES
# ============================================================

DAILY_MYSTERIES = [

    {
        "title": "The Vanishing File",
        "category": "technology",

        "question": (
            "A file exists in your local folder but disappears "
            "after a synchronization process. What should you "
            "check first?"
        ),

        "options": [

            {
                "id": "A",
                "text": (
                    "Synchronization rules and ignore patterns."
                ),
            },

            {
                "id": "B",
                "text": (
                    "The monitor brightness."
                ),
            },

            {
                "id": "C",
                "text": (
                    "The keyboard layout."
                ),
            },
        ],

        "answer": "A",

        "explanation": (
            "Synchronization rules may exclude or move the file."
        ),
    },


    {
        "title": "The Impossible Score",
        "category": "data",

        "question": (
            "A model reports 100% test accuracy but performs poorly "
            "on new data. What should you investigate?"
        ),

        "options": [

            {
                "id": "A",
                "text": (
                    "Data leakage or an unrepresentative test set."
                ),
            },

            {
                "id": "B",
                "text": (
                    "The monitor resolution."
                ),
            },

            {
                "id": "C",
                "text": (
                    "The keyboard speed."
                ),
            },
        ],

        "answer": "A",

        "explanation": (
            "An unusually perfect test score can indicate leakage "
            "or a test set that does not represent real-world data."
        ),
    },


    {
        "title": "The Deadline Trap",
        "category": "planning",

        "question": (
            "You have one urgent high-impact task and several "
            "low-impact tasks. What should generally be considered first?"
        ),

        "options": [

            {
                "id": "A",
                "text": (
                    "The urgent high-impact task."
                ),
            },

            {
                "id": "B",
                "text": (
                    "The easiest task."
                ),
            },

            {
                "id": "C",
                "text": (
                    "A random task."
                ),
            },
        ],

        "answer": "A",

        "explanation": (
            "Urgency and impact are useful factors when prioritizing work."
        ),
    },
]


def get_daily_mystery(
    edu_id: str = "",
) -> Dict[str, Any]:
    """
    Return a deterministic daily mystery.

    EDU ID is used so the same user receives the same
    mystery during the same day.
    """

    date_key = datetime.utcnow().strftime(
        "%Y-%m-%d"
    )

    seed_text = (
        f"{edu_id}|"
        f"{date_key}"
    )

    seed_hash = hashlib.sha256(
        seed_text.encode(
            "utf-8"
        )
    ).hexdigest()

    index = int(
        seed_hash[:8],
        16,
    ) % len(
        DAILY_MYSTERIES
    )

    mystery = dict(
        DAILY_MYSTERIES[index]
    )

    mystery[
        "challenge_id"
    ] = (
        "DAILY-"
        + seed_hash[:10].upper()
    )

    mystery[
        "date"
    ] = date_key

    return mystery


# ============================================================
# BUILD GAME RESULT RECORD
# ============================================================

def build_game_result_record(
    edu_id: str,
    user_type: str,
    game: Dict[str, Any],
    evaluation: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Build a clean, storage-ready game result record.
    """

    played_at = datetime.utcnow().isoformat()

    result_seed = (
        f"{edu_id}|"
        f"{game.get('challenge_id', '')}|"
        f"{played_at}"
    )

    result_hash = hashlib.sha256(
        result_seed.encode(
            "utf-8"
        )
    ).hexdigest()[:10].upper()

    result_id = (
        f"RESULT-{result_hash}"
    )

    difficulty_value = game.get(
        "difficulty",
        {},
    )

    if not isinstance(
        difficulty_value,
        dict,
    ):

        difficulty_value = {
            "level": safe_int(
                difficulty_value
            ),

            "difficulty": "unknown",
        }

    return {

        "result_id": result_id,

        "game_id": game.get(
            "game_id"
        ),

        "challenge_id": game.get(
            "challenge_id"
        ),

        "edu_id": edu_id,

        "user_type": normalize_user_type(
            user_type
        ),

        "game_type": game.get(
            "game_type"
        ),

        "game_name": game.get(
            "game_name"
        ),

        "title": game.get(
            "title"
        ),

        "category": game.get(
            "category"
        ),

        "difficulty": difficulty_value,

        "score": safe_float(
            evaluation.get(
                "score",
                0,
            )
        ),

        "xp": safe_int(
            evaluation.get(
                "xp",
                0,
            )
        ),

        "correct": bool(
            evaluation.get(
                "correct",
                False,
            )
        ),

        "time_taken_seconds": safe_int(
            evaluation.get(
                "time_taken_seconds",
                0,
            )
        ),

        "skill_scores": normalize_skill_scores(
            evaluation.get(
                "skill_scores",
                {},
            )
        ),

        "played_at": played_at,
    }


# ============================================================
# GAME SUMMARY
# ============================================================

def summarize_game_results(
    results: Optional[
        List[Dict[str, Any]]
    ] = None,
) -> Dict[str, Any]:
    """
    Create a dashboard summary from game history.
    """

    records = results or []

    if not records:

        return {

            "games_played": 0,

            "average_score": 0,

            "total_xp": 0,

            "best_score": 0,

            "correct_answers": 0,

            "accuracy": 0,

            "thinking_profile": update_thinking_profile(
                []
            ),

            "game_breakdown": {},
        }

    scores: List[float] = []

    total_xp = 0

    correct_answers = 0

    breakdown: Dict[
        str,
        Dict[str, Any]
    ] = {}

    for record in records:

        score = clamp(
            safe_float(
                record.get(
                    "score",
                    0,
                )
            ),
            0,
            100,
        )

        scores.append(
            score
        )

        total_xp += max(
            0,
            safe_int(
                record.get(
                    "xp",
                    0,
                )
            ),
        )

        if bool(
            record.get(
                "correct",
                False,
            )
        ):

            correct_answers += 1

        game_type = str(
            record.get(
                "game_type",
                "unknown",
            )
        )

        if game_type not in breakdown:

            breakdown[
                game_type
            ] = {

                "games": 0,

                "average_score": 0,

                "best_score": 0,

                "total_xp": 0,
            }

        breakdown[
            game_type
        ][
            "games"
        ] += 1

        breakdown[
            game_type
        ][
            "total_xp"
        ] += max(
            0,
            safe_int(
                record.get(
                    "xp",
                    0,
                )
            ),
        )

        breakdown[
            game_type
        ][
            "best_score"
        ] = max(
            breakdown[
                game_type
            ][
                "best_score"
            ],
            score,
        )

    # --------------------------------------------------------
    # Average by game type
    # --------------------------------------------------------

    for game_type in breakdown:

        game_scores = [

            clamp(
                safe_float(
                    record.get(
                        "score",
                        0,
                    )
                ),
                0,
                100,
            )

            for record in records

            if str(
                record.get(
                    "game_type",
                    "unknown",
                )
            ) == game_type
        ]

        if game_scores:

            breakdown[
                game_type
            ][
                "average_score"
            ] = round(
                sum(
                    game_scores
                )
                / len(
                    game_scores
                ),
                2,
            )

    average_score = (

        round(
            sum(scores)
            / len(scores),
            2,
        )

        if scores

        else 0
    )

    best_score = (

        max(scores)

        if scores

        else 0
    )

    accuracy = (

        round(
            (
                correct_answers
                / len(records)
            )
            * 100,
            2,
        )

        if records

        else 0
    )

    thinking_profile = update_thinking_profile(
        records
    )

    level = calculate_level(
        total_xp
    )

    return {

        "games_played": len(
            records
        ),

        "average_score": average_score,

        "total_xp": total_xp,

        "best_score": best_score,

        "correct_answers": correct_answers,

        "accuracy": accuracy,

        "level": level.get(
            "level",
            1,
        ),

        "level_details": level,

        "thinking_profile": thinking_profile,

        "game_breakdown": breakdown,
    }


# ============================================================
# RECOMMEND NEXT GAME
# ============================================================

def recommend_next_game(
    results: Optional[
        List[Dict[str, Any]]
    ] = None,
) -> Dict[str, Any]:
    """
    Recommend the next Game Lab challenge based on
    the user's thinking profile.
    """

    records = results or []

    profile = update_thinking_profile(
        records
    )

    measured = {

        skill: score

        for skill, score in profile.items()

        if score > 0
    }

    # --------------------------------------------------------
    # Decision Making
    # --------------------------------------------------------

    if profile.get(
        "decision_making",
        0,
    ) == 0:

        return {

            "game_type": GAME_AI_SWITCH,

            "reason": (
                "Decision Making has not been measured yet. "
                "AI Switch can help EduTrace understand how "
                "you approach changing situations."
            ),

            "focus_skill": "Decision Making",
        }

    # --------------------------------------------------------
    # Creativity
    # --------------------------------------------------------

    if profile.get(
        "creativity",
        0,
    ) == 0:

        return {

            "game_type": GAME_AI_VS_YOU,

            "reason": (
                "Creativity has not been measured yet. "
                "AI vs You can provide a new reasoning challenge."
            ),

            "focus_skill": "Creativity",
        }

    # --------------------------------------------------------
    # Planning
    # --------------------------------------------------------

    if profile.get(
        "planning",
        0,
    ) == 0:

        return {

            "game_type": GAME_AI_SWITCH,

            "reason": (
                "Planning has not been measured yet. "
                "AI Switch can help build a planning profile."
            ),

            "focus_skill": "Planning",
        }

    # --------------------------------------------------------
    # No measured skills
    # --------------------------------------------------------

    if not measured:

        return {

            "game_type": GAME_AI_DETECTIVE,

            "reason": (
                "Start with AI Detective to establish "
                "your initial thinking profile."
            ),

            "focus_skill": "Observation",
        }

    # --------------------------------------------------------
    # Weakest measured skill
    # --------------------------------------------------------

    weakest_skill = min(
        measured,
        key=measured.get,
    )

    if weakest_skill in {
        "decision_making",
        "planning",
    }:

        return {

            "game_type": GAME_AI_SWITCH,

            "reason": (
                "Your next challenge focuses on decision "
                "making and planning."
            ),

            "focus_skill": (
                weakest_skill
                .replace(
                    "_",
                    " ",
                )
                .title()
            ),
        }

    if weakest_skill == "creativity":

        return {

            "game_type": GAME_AI_VS_YOU,

            "reason": (
                "Your next challenge focuses on creative "
                "reasoning and comparison with AI."
            ),

            "focus_skill": "Creativity",
        }

    return {

        "game_type": GAME_AI_DETECTIVE,

        "reason": (
            "Your next challenge focuses on observation, "
            "logic and problem solving."
        ),

        "focus_skill": (
            weakest_skill
            .replace(
                "_",
                " ",
            )
            .title()
        ),
    }


# ============================================================
# PUBLIC EXPORTS
# ============================================================

__all__ = [

    "GAME_AI_DETECTIVE",

    "GAME_AI_SWITCH",

    "GAME_AI_VS_YOU",

    "SUPPORTED_GAMES",

    "USER_STUDENT",

    "USER_WORKING_PROFESSIONAL",

    "USER_GENERAL",

    "SUPPORTED_USER_TYPES",

    "DIFFICULTY_LEVELS",

    "THINKING_SKILLS",

    "normalize_text",

    "clamp",

    "safe_int",

    "safe_float",

    "generate_game_id",

    "generate_challenge_id",

    "normalize_skill_name",

    "normalize_skill_scores",

    "normalize_user_type",

    "calculate_adaptive_difficulty",

    "get_user_context",

    "get_detective_case",

    "score_detective",

    "get_switch_scenario",

    "score_switch",

    "get_ai_vs_you_challenge",

    "normalize_answer_for_comparison",

    "score_ai_vs_you",

    "calculate_xp",

    "calculate_level",

    "empty_thinking_profile",

    "update_thinking_profile",

    "generate_game",

    "evaluate_game",

    "get_daily_mystery",

    "build_game_result_record",

    "summarize_game_results",

    "recommend_next_game",
]