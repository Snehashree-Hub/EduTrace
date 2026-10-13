# backend/app/services/game_personalization.py

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[3]

GAME_RESULTS_FILE = BASE_DIR / "data" / "users" / "game_results.json"


# ============================================================
# SUPPORTED THINKING SKILLS
# ============================================================

SUPPORTED_SKILLS = [
    "logic",
    "observation",
    "problem_solving",
    "decision_making",
    "creativity",
    "risk_awareness",
    "planning",
]


SKILL_LABELS = {
    "logic": "Logic",
    "observation": "Observation",
    "problem_solving": "Problem Solving",
    "decision_making": "Decision Making",
    "creativity": "Creativity",
    "risk_awareness": "Risk Awareness",
    "planning": "Planning",
}


# ============================================================
# GAME → SKILL MAPPING
# ============================================================

GAME_SKILL_MAPPING = {
    "ai_detective": [
        "observation",
        "logic",
        "problem_solving",
        "risk_awareness",
    ],
    "ai_switch": [
        "decision_making",
        "planning",
        "risk_awareness",
        "problem_solving",
    ],
    "ai_vs_you": [
        "logic",
        "creativity",
        "problem_solving",
        "decision_making",
    ],
}


# ============================================================
# JSON HELPERS
# ============================================================

def load_game_results() -> List[Dict[str, Any]]:
    """
    Load stored Game Lab results.

    Returns an empty list if the file does not exist,
    is empty, or contains invalid JSON.
    """

    try:
        if not GAME_RESULTS_FILE.exists():
            return []

        with open(GAME_RESULTS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        if isinstance(data, list):
            return data

        return []

    except (OSError, json.JSONDecodeError, TypeError):
        return []


# ============================================================
# USER RESULT FILTER
# ============================================================

def get_user_game_results(edu_id: str) -> List[Dict[str, Any]]:
    """
    Return valid Game Lab results belonging to the requested EDU ID.
    EDU IDs are compared case-insensitively.
    """

    if not edu_id:
        return []

    target_edu_id = str(edu_id).strip().upper()

    results = load_game_results()
    user_results: List[Dict[str, Any]] = []

    for result in results:

        if not isinstance(result, dict):
            continue

        result_edu_id = str(result.get("edu_id", "")).strip().upper()

        if result_edu_id != target_edu_id:
            continue

        # Ignore malformed records.
        if not result.get("game_id"):
            continue

        if not result.get("game_type"):
            continue

        user_results.append(result)

    return user_results


# ============================================================
# SKILL HELPERS
# ============================================================

def empty_skill_scores() -> Dict[str, float]:
    """
    Create a complete skill dictionary.

    Zero means the skill has not been measured yet.
    """

    return {
        skill: 0
        for skill in SUPPORTED_SKILLS
    }


def normalize_skill_scores(
    skill_scores: Any,
) -> Dict[str, float]:
    """
    Safely normalize skill scores from stored game results.
    """

    normalized = empty_skill_scores()

    if not isinstance(skill_scores, dict):
        return normalized

    for skill in SUPPORTED_SKILLS:

        value = skill_scores.get(skill, 0)

        try:
            value = float(value)
        except (TypeError, ValueError):
            value = 0

        value = max(0, min(100, value))

        # Return integers when possible for cleaner API output.
        if value.is_integer():
            normalized[skill] = int(value)
        else:
            normalized[skill] = round(value, 2)

    return normalized


# ============================================================
# THINKING PROFILE
# ============================================================

def calculate_thinking_profile(
    results: List[Dict[str, Any]],
) -> Dict[str, float]:
    """
    Calculate the user's thinking profile.

    IMPORTANT:
    Only skills actually measured by completed games are included
    in the measured profile.

    A skill with no evidence remains 0 internally, but it is NOT
    considered a weakness.
    """

    skill_totals: Dict[str, float] = {
        skill: 0
        for skill in SUPPORTED_SKILLS
    }

    skill_counts: Dict[str, int] = {
        skill: 0
        for skill in SUPPORTED_SKILLS
    }

    for result in results:

        if not isinstance(result, dict):
            continue

        raw_scores = result.get("skill_scores", {})

        if not isinstance(raw_scores, dict):
            continue

        scores = normalize_skill_scores(raw_scores)

        # Determine which skills were actually measured
        game_type = str(
            result.get("game_type", "")
        ).strip().lower()

        mapped_skills = GAME_SKILL_MAPPING.get(
            game_type,
            []
        )

        for skill in mapped_skills:

            if skill not in SUPPORTED_SKILLS:
                continue

            # If this result explicitly contains a non-zero score,
            # treat it as measured.
            if skill in raw_scores:

                try:
                    raw_value = float(raw_scores.get(skill, 0))
                except (TypeError, ValueError):
                    continue

                if raw_value > 0:
                    skill_totals[skill] += scores[skill]
                    skill_counts[skill] += 1

    profile: Dict[str, float] = {}

    for skill in SUPPORTED_SKILLS:

        if skill_counts[skill] == 0:
            profile[skill] = 0
        else:
            average = (
                skill_totals[skill]
                / skill_counts[skill]
            )

            if float(average).is_integer():
                profile[skill] = int(average)
            else:
                profile[skill] = round(average, 2)

    return profile


# ============================================================
# MEASURED SKILLS
# ============================================================

def get_measured_skills(
    results: List[Dict[str, Any]],
) -> List[str]:
    """
    Return skills for which the user has actual game evidence.
    """

    measured = set()

    for result in results:

        if not isinstance(result, dict):
            continue

        game_type = str(
            result.get("game_type", "")
        ).strip().lower()

        mapped_skills = GAME_SKILL_MAPPING.get(
            game_type,
            []
        )

        raw_scores = result.get("skill_scores", {})

        if not isinstance(raw_scores, dict):
            continue

        for skill in mapped_skills:

            if skill not in raw_scores:
                continue

            try:
                value = float(raw_scores.get(skill, 0))
            except (TypeError, ValueError):
                continue

            if value > 0:
                measured.add(skill)

    # Keep the original supported skill order.
    return [
        skill
        for skill in SUPPORTED_SKILLS
        if skill in measured
    ]


# ============================================================
# UNMEASURED SKILLS
# ============================================================

def get_unmeasured_skills(
    results: List[Dict[str, Any]],
) -> List[str]:
    """
    Return skills that have not yet been measured.
    """

    measured = set(
        get_measured_skills(results)
    )

    return [
        skill
        for skill in SUPPORTED_SKILLS
        if skill not in measured
    ]


# ============================================================
# STRENGTHS
# ============================================================

def identify_strengths(
    thinking_profile: Dict[str, float],
    measured_skills: List[str],
    threshold: float = 20,
) -> List[str]:
    """
    Identify measured strengths.

    Unmeasured skills are NEVER included.
    """

    strengths = []

    for skill in measured_skills:

        score = thinking_profile.get(skill, 0)

        try:
            score = float(score)
        except (TypeError, ValueError):
            continue

        if score >= threshold:
            strengths.append(
                SKILL_LABELS.get(skill, skill.title())
            )

    return strengths


# ============================================================
# AREAS TO DEVELOP
# ============================================================

def identify_improvement_areas(
    thinking_profile: Dict[str, float],
    measured_skills: List[str],
    threshold: float = 20,
) -> List[str]:
    """
    Identify measured skills that may need improvement.

    IMPORTANT:
    A skill is included only when it has actually been measured.
    """

    improvement_areas = []

    for skill in measured_skills:

        score = thinking_profile.get(skill, 0)

        try:
            score = float(score)
        except (TypeError, ValueError):
            continue

        if score < threshold:
            improvement_areas.append(
                SKILL_LABELS.get(skill, skill.title())
            )

    return improvement_areas


# ============================================================
# RECOMMENDED FOCUS
# ============================================================

def calculate_recommended_focus(
    thinking_profile: Dict[str, float],
    measured_skills: List[str],
    unmeasured_skills: List[str],
    max_items: int = 3,
) -> List[str]:
    """
    Select the next useful areas for Game Lab.

    Priority:
    1. Measured skills that need development.
    2. Unmeasured skills that should be tested next.

    This avoids incorrectly calling an unmeasured skill weak.
    """

    focus: List[str] = []

    # --------------------------------------------------------
    # First: measured lower-scoring skills
    # --------------------------------------------------------

    measured_sorted = sorted(
        measured_skills,
        key=lambda skill: thinking_profile.get(skill, 0)
    )

    for skill in measured_sorted:

        score = thinking_profile.get(skill, 0)

        try:
            score = float(score)
        except (TypeError, ValueError):
            continue

        if score < 20:
            focus.append(skill)

        if len(focus) >= max_items:
            break

    # --------------------------------------------------------
    # Second: unmeasured skills
    # --------------------------------------------------------

    if len(focus) < max_items:

        for skill in unmeasured_skills:

            if skill not in focus:
                focus.append(skill)

            if len(focus) >= max_items:
                break

    return [
        SKILL_LABELS.get(skill, skill.title())
        for skill in focus
    ]


# ============================================================
# GAME TYPE SUMMARY
# ============================================================

def build_game_type_summary(
    results: List[Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """
    Build performance summary grouped by game type.
    """

    summary: Dict[str, Dict[str, Any]] = {}

    for result in results:

        game_type = str(
            result.get("game_type", "unknown")
        ).strip().lower()

        if game_type not in summary:
            summary[game_type] = {
                "games": 0,
                "total_xp": 0,
                "total_score": 0,
                "average_score": 0,
            }

        item = summary[game_type]

        item["games"] += 1

        try:
            item["total_xp"] += int(
                result.get("xp", 0) or 0
            )
        except (TypeError, ValueError):
            pass

        try:
            item["total_score"] += float(
                result.get("score", 0) or 0
            )
        except (TypeError, ValueError):
            pass

    for game_type, item in summary.items():

        games = item["games"]

        if games > 0:
            average = (
                item["total_score"]
                / games
            )

            if float(average).is_integer():
                item["average_score"] = int(average)
            else:
                item["average_score"] = round(
                    average,
                    2,
                )

        item.pop("total_score", None)

    return summary


# ============================================================
# CATEGORY SUMMARY
# ============================================================

def build_category_summary(
    results: List[Dict[str, Any]],
) -> Dict[str, int]:
    """
    Count games by category.
    """

    categories: Dict[str, int] = {}

    for result in results:

        category = str(
            result.get("category", "general")
        ).strip()

        if not category:
            category = "general"

        categories[category] = (
            categories.get(category, 0) + 1
        )

    return categories


# ============================================================
# RECENT PERFORMANCE
# ============================================================

def build_recent_performance(
    results: List[Dict[str, Any]],
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Return recent Game Lab performance.
    """

    sorted_results = sorted(
        results,
        key=lambda item: str(
            item.get("played_at", "")
        ),
        reverse=True,
    )

    recent = []

    for result in sorted_results[:limit]:

        recent.append(
            {
                "game_type": result.get(
                    "game_type",
                    "",
                ),
                "game_name": result.get(
                    "game_name",
                    "",
                ),
                "title": result.get(
                    "title",
                    "",
                ),
                "category": result.get(
                    "category",
                    "",
                ),
                "score": result.get(
                    "score",
                    0,
                ),
                "xp": result.get(
                    "xp",
                    0,
                ),
                "correct": result.get(
                    "correct",
                    False,
                ),
                "played_at": result.get(
                    "played_at",
                    "",
                ),
            }
        )

    return recent


# ============================================================
# RECOMMENDED GAME
# ============================================================

def recommend_personalized_game(
    thinking_profile: Dict[str, float],
    measured_skills: List[str],
    unmeasured_skills: List[str],
) -> Dict[str, str]:
    """
    Recommend the next Game Lab challenge.

    Preference is given to:
    - measured skills needing development
    - otherwise unmeasured skills that can expand the profile
    """

    measured_set = set(measured_skills)
    unmeasured_set = set(unmeasured_skills)

    # --------------------------------------------------------
    # Measured weaknesses
    # --------------------------------------------------------

    measured_priority = sorted(
        measured_skills,
        key=lambda skill: thinking_profile.get(skill, 0)
    )

    for skill in measured_priority:

        score = thinking_profile.get(skill, 0)

        try:
            score = float(score)
        except (TypeError, ValueError):
            continue

        if score < 20:

            if skill in {
                "decision_making",
                "planning",
            }:
                return {
                    "game_type": "ai_switch",
                    "reason": (
                        "Your measured profile suggests "
                        "more practice with decision-making "
                        "and planning could be useful."
                    ),
                    "focus_skill": SKILL_LABELS[skill],
                }

            if skill in {
                "creativity",
            }:
                return {
                    "game_type": "ai_vs_you",
                    "reason": (
                        "Your measured profile suggests "
                        "more creative reasoning practice "
                        "could be useful."
                    ),
                    "focus_skill": SKILL_LABELS[skill],
                }

            if skill in {
                "observation",
                "risk_awareness",
                "logic",
            }:
                return {
                    "game_type": "ai_detective",
                    "reason": (
                        "Your measured profile suggests "
                        "more investigative reasoning practice "
                        "could be useful."
                    ),
                    "focus_skill": SKILL_LABELS[skill],
                }

    # --------------------------------------------------------
    # Unmeasured skills
    # --------------------------------------------------------

    if "decision_making" in unmeasured_set:
        return {
            "game_type": "ai_switch",
            "reason": (
                "Decision Making has not been measured yet. "
                "AI Switch can help EduTrace understand "
                "how you approach changing situations."
            ),
            "focus_skill": "Decision Making",
        }

    if "planning" in unmeasured_set:
        return {
            "game_type": "ai_switch",
            "reason": (
                "Planning has not been measured yet. "
                "AI Switch can introduce scenario-based "
                "planning challenges."
            ),
            "focus_skill": "Planning",
        }

    if "creativity" in unmeasured_set:
        return {
            "game_type": "ai_vs_you",
            "reason": (
                "Creativity has not been measured yet. "
                "AI vs You can introduce open-ended "
                "reasoning challenges."
            ),
            "focus_skill": "Creativity",
        }

    if "observation" in unmeasured_set:
        return {
            "game_type": "ai_detective",
            "reason": (
                "Observation has not been measured yet. "
                "AI Detective can introduce investigative "
                "clue-based challenges."
            ),
            "focus_skill": "Observation",
        }

    # --------------------------------------------------------
    # Default
    # --------------------------------------------------------

    return {
        "game_type": "ai_detective",
        "reason": (
            "Continue with an investigative challenge "
            "to build your Game Lab profile."
        ),
        "focus_skill": "Observation",
    }


# ============================================================
# GAME SUMMARY
# ============================================================

def build_game_summary(
    results: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Build overall Game Lab statistics.
    """

    games_played = len(results)

    if games_played == 0:
        return {
            "average_score": 0,
            "highest_score": 0,
            "lowest_score": 0,
            "total_xp": 0,
            "correct_answers": 0,
            "incorrect_answers": 0,
            "accuracy": 0,
            "game_types": {},
            "categories": {},
            "recent_performance": [],
        }

    scores: List[float] = []
    total_xp = 0
    correct_answers = 0

    for result in results:

        try:
            scores.append(
                float(result.get("score", 0) or 0)
            )
        except (TypeError, ValueError):
            pass

        try:
            total_xp += int(
                result.get("xp", 0) or 0
            )
        except (TypeError, ValueError):
            pass

        if result.get("correct") is True:
            correct_answers += 1

    incorrect_answers = (
        games_played - correct_answers
    )

    average_score = (
        sum(scores) / len(scores)
        if scores
        else 0
    )

    highest_score = (
        max(scores)
        if scores
        else 0
    )

    lowest_score = (
        min(scores)
        if scores
        else 0
    )

    accuracy = (
        correct_answers
        / games_played
        * 100
    )

    def clean_number(value: float):
        if float(value).is_integer():
            return int(value)

        return round(value, 2)

    return {
        "average_score": clean_number(
            average_score
        ),
        "highest_score": clean_number(
            highest_score
        ),
        "lowest_score": clean_number(
            lowest_score
        ),
        "total_xp": total_xp,
        "correct_answers": correct_answers,
        "incorrect_answers": incorrect_answers,
        "accuracy": clean_number(accuracy),
        "game_types": build_game_type_summary(
            results
        ),
        "categories": build_category_summary(
            results
        ),
        "recent_performance": build_recent_performance(
            results
        ),
    }


# ============================================================
# MAIN PERSONALIZATION PROFILE
# ============================================================

def get_game_personalization(
    edu_id: str,
) -> Dict[str, Any]:
    """
    Generate the complete Game Lab personalization profile.
    """

    results = get_user_game_results(
        edu_id
    )

    # --------------------------------------------------------
    # No Game Lab history
    # --------------------------------------------------------

    if not results:

        return {
            "available": False,
            "edu_id": edu_id,
            "message": (
                "No Game Lab profile is available yet. "
                "Play a Game Lab challenge to start "
                "building your thinking profile."
            ),
            "games_played": 0,
            "thinking_profile": empty_skill_scores(),
            "measured_skills": [],
            "unmeasured_skills": [
                SKILL_LABELS[skill]
                for skill in SUPPORTED_SKILLS
            ],
            "strengths": [],
            "improvement_areas": [],
            "recommended_focus": [
                "Decision Making",
                "Creativity",
                "Planning",
            ],
            "recommended_game": {
                "game_type": "ai_switch",
                "reason": (
                    "Start with a scenario-based challenge "
                    "to begin measuring your thinking profile."
                ),
                "focus_skill": "Decision Making",
            },
            "game_summary": build_game_summary([]),
        }

    # --------------------------------------------------------
    # Calculate profile
    # --------------------------------------------------------

    thinking_profile = calculate_thinking_profile(
        results
    )

    measured_skill_keys = get_measured_skills(
        results
    )

    unmeasured_skill_keys = get_unmeasured_skills(
        results
    )

    strengths = identify_strengths(
        thinking_profile,
        measured_skill_keys,
    )

    improvement_areas = identify_improvement_areas(
        thinking_profile,
        measured_skill_keys,
    )

    recommended_focus = calculate_recommended_focus(
        thinking_profile,
        measured_skill_keys,
        unmeasured_skill_keys,
    )

    recommended_game = recommend_personalized_game(
        thinking_profile,
        measured_skill_keys,
        unmeasured_skill_keys,
    )

    game_summary = build_game_summary(
        results
    )

    return {
        "available": True,
        "edu_id": edu_id,
        "message": (
            "Game Lab personalization profile "
            "generated successfully."
        ),
        "games_played": len(results),

        "thinking_profile": thinking_profile,

        # Human-readable measured skills
        "measured_skills": [
            SKILL_LABELS[skill]
            for skill in measured_skill_keys
        ],

        # Human-readable skills that have not been measured
        "unmeasured_skills": [
            SKILL_LABELS[skill]
            for skill in unmeasured_skill_keys
        ],

        "strengths": strengths,

        # Only measured skills can appear here.
        "improvement_areas": improvement_areas,

        "recommended_focus": recommended_focus,

        "recommended_game": recommended_game,

        "game_summary": game_summary,
    }


# ============================================================
# AI CONTEXT
# ============================================================

def build_game_ai_context(
    edu_id: str,
) -> str:
    """
    Build a clean text context that EduTrace AI can use
    when generating personalized responses.
    """

    profile = get_game_personalization(
        edu_id
    )

    if not profile.get("available"):
        return (
            "GAME LAB PERSONALIZATION:\n"
            "No Game Lab games have been completed yet.\n"
            "Game Lab can start measuring Logic, Observation, "
            "Problem Solving, Decision Making, Creativity, "
            "Risk Awareness and Planning after the user "
            "plays challenges."
        )

    summary = profile.get(
        "game_summary",
        {}
    )

    thinking_profile = profile.get(
        "thinking_profile",
        {}
    )

    measured_skills = profile.get(
        "measured_skills",
        []
    )

    unmeasured_skills = profile.get(
        "unmeasured_skills",
        []
    )

    strengths = profile.get(
        "strengths",
        []
    )

    improvement_areas = profile.get(
        "improvement_areas",
        []
    )

    recommended_focus = profile.get(
        "recommended_focus",
        []
    )

    recommended_game = profile.get(
        "recommended_game",
        {}
    )

    lines = [
        "GAME LAB PERSONALIZATION:",
        f"Games played: {profile.get('games_played', 0)}",
        f"Average score: {summary.get('average_score', 0)}%",
        f"Accuracy: {summary.get('accuracy', 0)}%",
        f"Total XP: {summary.get('total_xp', 0)}",
        "",
        "Thinking profile:",
    ]

    # --------------------------------------------------------
    # Thinking profile
    # --------------------------------------------------------

    for skill in SUPPORTED_SKILLS:

        label = SKILL_LABELS[skill]
        score = thinking_profile.get(
            skill,
            0,
        )

        if skill in {
            item.lower().replace(" ", "_")
            for item in measured_skills
        }:
            lines.append(
                f"- {label}: {score}"
            )
        else:
            lines.append(
                f"- {label}: Not measured yet"
            )

    # --------------------------------------------------------
    # Measured strengths
    # --------------------------------------------------------

    if strengths:
        lines.extend(
            [
                "",
                "Measured strengths:",
            ]
        )

        for item in strengths:
            lines.append(
                f"- {item}"
            )
    else:
        lines.extend(
            [
                "",
                "Measured strengths: None identified yet.",
            ]
        )

    # --------------------------------------------------------
    # Measured improvement areas
    # --------------------------------------------------------

    if improvement_areas:
        lines.extend(
            [
                "",
                "Measured areas that may need improvement:",
            ]
        )

        for item in improvement_areas:
            lines.append(
                f"- {item}"
            )
    else:
        lines.extend(
            [
                "",
                "Measured improvement areas: None identified yet.",
            ]
        )

    # --------------------------------------------------------
    # Unmeasured skills
    # --------------------------------------------------------

    if unmeasured_skills:
        lines.extend(
            [
                "",
                "Skills not measured yet:",
            ]
        )

        for item in unmeasured_skills:
            lines.append(
                f"- {item}"
            )

    # --------------------------------------------------------
    # Recommended focus
    # --------------------------------------------------------

    if recommended_focus:
        lines.extend(
            [
                "",
                "Recommended focus:",
            ]
        )

        for item in recommended_focus:
            lines.append(
                f"- {item}"
            )

    # --------------------------------------------------------
    # Recommended game
    # --------------------------------------------------------

    lines.extend(
        [
            "",
            "Recommended Game Lab challenge:",
            f"- Game type: {recommended_game.get('game_type', 'ai_detective')}",
            f"- Focus skill: {recommended_game.get('focus_skill', 'Observation')}",
            f"- Reason: {recommended_game.get('reason', '')}",
        ]
    )

    lines.extend(
        [
            "",
            "Use this Game Lab profile to personalize "
            "future explanations, practice questions, "
            "reasoning challenges and recommendations.",
        ]
    )

    return "\n".join(lines)


# ============================================================
# END OF FILE
# ============================================================