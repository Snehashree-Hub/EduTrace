from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.services.game_engine import (
    generate_game,
    score_detective,
    score_switch,
    score_ai_vs_you,
)

from backend.app.services.game_personalization import (
    get_game_personalization,
    build_game_ai_context,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/games",
    tags=["Game Lab"],
)


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "..",
    )
)

DATA_DIR = os.path.join(
    PROJECT_ROOT,
    "data",
    "users",
)

GAME_RESULTS_FILE = os.path.join(
    DATA_DIR,
    "game_results.json",
)

GAME_SESSIONS_FILE = os.path.join(
    DATA_DIR,
    "game_sessions.json",
)

GAME_ACHIEVEMENTS_FILE = os.path.join(
    DATA_DIR,
    "game_achievements.json",
)


# ============================================================
# STORAGE
# ============================================================

def ensure_storage_files() -> None:

    os.makedirs(
        DATA_DIR,
        exist_ok=True,
    )

    for path in [
        GAME_RESULTS_FILE,
        GAME_SESSIONS_FILE,
        GAME_ACHIEVEMENTS_FILE,
    ]:

        if not os.path.exists(path):

            with open(
                path,
                "w",
                encoding="utf-8",
            ) as file:

                json.dump(
                    [],
                    file,
                    indent=2,
                )


def load_json_list(
    path: str,
) -> List[Dict[str, Any]]:

    ensure_storage_files()

    try:

        with open(
            path,
            "r",
            encoding="utf-8",
        ) as file:

            data = json.load(file)

        return data if isinstance(data, list) else []

    except Exception:

        return []


def save_json_list(
    path: str,
    data: List[Dict[str, Any]],
) -> None:

    ensure_storage_files()

    temp_path = path + ".tmp"

    with open(
        temp_path,
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            data,
            file,
            indent=2,
            ensure_ascii=False,
        )

    os.replace(
        temp_path,
        path,
    )


def load_results() -> List[Dict[str, Any]]:
    return load_json_list(
        GAME_RESULTS_FILE
    )


def save_results(
    results: List[Dict[str, Any]],
) -> None:

    save_json_list(
        GAME_RESULTS_FILE,
        results,
    )


def load_sessions() -> List[Dict[str, Any]]:
    return load_json_list(
        GAME_SESSIONS_FILE
    )


def save_sessions(
    sessions: List[Dict[str, Any]],
) -> None:

    save_json_list(
        GAME_SESSIONS_FILE,
        sessions,
    )


def load_achievements() -> List[Dict[str, Any]]:
    return load_json_list(
        GAME_ACHIEVEMENTS_FILE
    )


def save_achievements(
    achievements: List[Dict[str, Any]],
) -> None:

    save_json_list(
        GAME_ACHIEVEMENTS_FILE,
        achievements,
    )


# ============================================================
# HELPERS
# ============================================================

def utc_now() -> str:

    return datetime.now(
        timezone.utc
    ).isoformat()


def safe_number(
    value: Any,
    default: float = 0,
) -> float:

    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def normalize_game_type(
    value: str,
) -> str:

    value = str(
        value or ""
    ).strip().lower()

    aliases = {
        "detective": "ai_detective",
        "ai detective": "ai_detective",
        "switch": "ai_switch",
        "ai switch": "ai_switch",
        "ai vs you": "ai_vs_you",
        "ai-vs-you": "ai_vs_you",
        "vs": "ai_vs_you",
    }

    value = aliases.get(
        value,
        value,
    )

    if value not in {
        "ai_detective",
        "ai_switch",
        "ai_vs_you",
    }:

        raise HTTPException(
            status_code=400,
            detail=(
                "Unsupported game_type. "
                "Use ai_detective, ai_switch "
                "or ai_vs_you."
            ),
        )

    return value


def normalize_user_type(
    value: str,
) -> str:

    value = str(
        value or "general"
    ).strip().lower()

    aliases = {
        "student": "student",
        "working": "working_professional",
        "working professional": "working_professional",
        "professional": "working_professional",
        "general": "general",
    }

    return aliases.get(
        value,
        "general",
    )


# ============================================================
# REQUEST MODELS
# ============================================================

class StartGameRequest(BaseModel):

    edu_id: str = Field(
        ...,
        min_length=1,
    )

    game_type: str = Field(
        ...,
        min_length=1,
    )

    user_type: str = Field(
        default="general",
        min_length=1,
    )

    difficulty: int = Field(
        default=1,
        ge=1,
        le=5,
    )


class SubmitGameRequest(BaseModel):

    edu_id: str = Field(
        ...,
        min_length=1,
    )

    challenge_id: str = Field(
        ...,
        min_length=1,
    )

    answer: str = Field(
        ...,
        min_length=1,
    )

    time_taken_seconds: int = Field(
        default=0,
        ge=0,
        le=86400,
    )

    clue_count: int = Field(
        default=0,
        ge=0,
        le=100,
    )

    reasoning_quality: Optional[int] = Field(
        default=None,
        ge=0,
        le=100,
    )


# ============================================================
# SECURITY SANITIZATION
# ============================================================

def sanitize_game_for_client(
    game: Dict[str, Any],
) -> Dict[str, Any]:

    blocked_keys = {
        "correct",
        "answer",
        "correct_answer",
        "explanation",
        "_internal",
        "solution",
        "reason",
        "impact",
        "score",
    }

    def clean(
        value: Any,
    ) -> Any:

        if isinstance(
            value,
            dict,
        ):

            output = {}

            for key, item in value.items():

                key_lower = str(
                    key
                ).lower()

                if key_lower in blocked_keys:
                    continue

                if str(key).startswith("_"):
                    continue

                output[key] = clean(item)

            return output

        if isinstance(
            value,
            list,
        ):

            return [
                clean(item)
                for item in value
            ]

        return value

    return clean(game)


# ============================================================
# GAME SESSIONS
# ============================================================

def create_game_session(
    game: Dict[str, Any],
    edu_id: str,
    user_type: str,
) -> Dict[str, Any]:

    sessions = load_sessions()

    session = {
        "session_id": (
            f"SESSION-"
            f"{uuid.uuid4().hex[:12].upper()}"
        ),
        "edu_id": edu_id,
        "user_type": user_type,
        "game_id": game.get(
            "game_id"
        ),
        "challenge_id": game.get(
            "challenge_id"
        ),
        "game_type": game.get(
            "game_type"
        ),
        "started_at": utc_now(),
        "submitted": False,

        # Complete answer-bearing game
        # stays on the server.
        "game": game,
    }

    sessions.append(
        session
    )

    save_sessions(
        sessions
    )

    return session


def find_game_session(
    edu_id: str,
    challenge_id: str,
) -> Optional[Dict[str, Any]]:

    sessions = load_sessions()

    edu_key = edu_id.strip().lower()
    challenge_key = (
        challenge_id.strip().lower()
    )

    for session in reversed(
        sessions
    ):

        if (
            str(
                session.get(
                    "edu_id",
                    "",
                )
            ).strip().lower()
            != edu_key
        ):
            continue

        if (
            str(
                session.get(
                    "challenge_id",
                    "",
                )
            ).strip().lower()
            != challenge_key
        ):
            continue

        return session

    return None


def mark_session_submitted(
    edu_id: str,
    challenge_id: str,
) -> bool:

    sessions = load_sessions()

    edu_key = edu_id.strip().lower()
    challenge_key = (
        challenge_id.strip().lower()
    )

    changed = False

    for session in sessions:

        if (
            str(
                session.get(
                    "edu_id",
                    "",
                )
            ).strip().lower()
            == edu_key
            and str(
                session.get(
                    "challenge_id",
                    "",
                )
            ).strip().lower()
            == challenge_key
        ):

            session["submitted"] = True
            session["submitted_at"] = utc_now()

            changed = True
            break

    if changed:
        save_sessions(
            sessions
        )

    return changed


# ============================================================
# STREAK
# ============================================================

def calculate_current_streak(
    edu_id: str,
    results: Optional[
        List[Dict[str, Any]]
    ] = None,
) -> int:

    if results is None:
        results = load_results()

    dates = set()

    for result in results:

        if (
            str(
                result.get(
                    "edu_id",
                    "",
                )
            ).strip().lower()
            != edu_id.strip().lower()
        ):
            continue

        played_at = result.get(
            "played_at"
        )

        if not played_at:
            continue

        try:

            date_value = datetime.fromisoformat(
                str(
                    played_at
                ).replace(
                    "Z",
                    "+00:00",
                )
            ).date()

            dates.add(
                date_value
            )

        except Exception:
            continue

    if not dates:
        return 0

    current = datetime.now(
        timezone.utc
    ).date()

    if current not in dates:

        current = current - timedelta(
            days=1
        )

    streak = 0

    while current in dates:

        streak += 1

        current -= timedelta(
            days=1
        )

    return streak


def get_streak_bonus(
    streak: int,
) -> int:

    if streak <= 1:
        return 0

    if streak == 2:
        return 10

    if streak == 3:
        return 20

    if streak == 4:
        return 25

    if streak == 5:
        return 30

    if streak == 6:
        return 40

    return 50


# ============================================================
# THINKING PROFILE
# ============================================================

SKILLS = [
    "logic",
    "observation",
    "problem_solving",
    "decision_making",
    "creativity",
    "risk_awareness",
    "planning",
]


def calculate_thinking_profile(
    results: List[Dict[str, Any]],
) -> Dict[str, int]:

    totals = {
        skill: 0
        for skill in SKILLS
    }

    counts = {
        skill: 0
        for skill in SKILLS
    }

    for result in results:

        scores = result.get(
            "skill_scores",
            {},
        )

        if not isinstance(
            scores,
            dict,
        ):
            continue

        for skill in SKILLS:

            value = scores.get(
                skill
            )

            if value is None:

                # Backward compatibility
                if skill == "decision_making":
                    value = scores.get(
                        "decision"
                    )

            if value is None:
                continue

            value = safe_number(
                value
            )

            totals[skill] += value
            counts[skill] += 1

    profile = {}

    for skill in SKILLS:

        if counts[skill] == 0:

            profile[skill] = 0

        else:

            profile[skill] = int(
                round(
                    totals[skill]
                    / counts[skill]
                )
            )

    return profile


# ============================================================
# SUMMARY
# ============================================================

def build_summary(
    edu_id: str,
    results: List[Dict[str, Any]],
) -> Dict[str, Any]:

    user_results = [
        item
        for item in results
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.strip().lower()
    ]

    games_played = len(
        user_results
    )

    total_xp = int(
        sum(
            safe_number(
                item.get(
                    "xp",
                    0,
                )
            )
            for item in user_results
        )
    )

    scores = [
        safe_number(
            item.get(
                "score",
                0,
            )
        )
        for item in user_results
    ]

    correct_answers = sum(
        1
        for item in user_results
        if item.get(
            "correct"
        ) is True
    )

    average_score = (
        round(
            sum(scores)
            / games_played,
            2,
        )
        if games_played
        else 0
    )

    accuracy = (
        round(
            correct_answers
            / games_played
            * 100,
            2,
        )
        if games_played
        else 0
    )

    game_breakdown = {}

    for item in user_results:

        game_type = item.get(
            "game_type",
            "unknown",
        )

        if game_type not in game_breakdown:

            game_breakdown[
                game_type
            ] = {
                "games": 0,
                "average_score": 0,
                "xp": 0,
            }

        game_breakdown[
            game_type
        ]["games"] += 1

        game_breakdown[
            game_type
        ]["xp"] += int(
            safe_number(
                item.get(
                    "xp",
                    0,
                )
            )
        )

    for game_type, data in game_breakdown.items():

        game_scores = [
            safe_number(
                item.get(
                    "score",
                    0,
                )
            )
            for item in user_results
            if item.get(
                "game_type"
            ) == game_type
        ]

        if game_scores:

            data[
                "average_score"
            ] = round(
                sum(game_scores)
                / len(game_scores),
                2,
            )

    recent_results = list(
        reversed(
            user_results[-10:]
        )
    )

    recent_results = [
        {
            "game_type": item.get(
                "game_type"
            ),
            "game_name": item.get(
                "game_name"
            ),
            "title": item.get(
                "title"
            ),
            "category": item.get(
                "category"
            ),
            "score": item.get(
                "score",
                0,
            ),
            "xp": item.get(
                "xp",
                0,
            ),
            "correct": item.get(
                "correct",
                False,
            ),
            "played_at": item.get(
                "played_at"
            ),
        }
        for item in recent_results
    ]

    return {
        "games_played": games_played,
        "average_score": average_score,
        "total_xp": total_xp,
        "correct_answers": correct_answers,
        "accuracy": accuracy,
        "level": max(
            1,
            (total_xp // 500) + 1,
        ),
        "streak": calculate_current_streak(
            edu_id,
            results,
        ),
        "thinking_profile": calculate_thinking_profile(
            user_results
        ),
        "game_breakdown": game_breakdown,
        "recent_results": recent_results,
    }


# ============================================================
# SCORING
# ============================================================

def score_game(
    game_type: str,
    game: Dict[str, Any],
    answer: str,
    time_taken_seconds: int,
    clue_count: int,
    reasoning_quality: Optional[int],
) -> Dict[str, Any]:

    answer = answer.strip()

    if game_type == "ai_detective":

        try:

            return score_detective(
                game=game,
                answer=answer,
                time_taken_seconds=time_taken_seconds,
                clue_count=clue_count,
                reasoning_quality=reasoning_quality,
                streak_bonus=0,
            )

        except TypeError:

            try:

                return score_detective(
                    game,
                    answer,
                    time_taken_seconds,
                    clue_count,
                    reasoning_quality,
                    0,
                )

            except TypeError:

                return score_detective(
                    game,
                    answer,
                )

    if game_type == "ai_switch":

        try:

            return score_switch(
                game=game,
                answer=answer,
                time_taken_seconds=time_taken_seconds,
                reasoning_quality=reasoning_quality,
                streak_bonus=0,
            )

        except TypeError:

            try:

                return score_switch(
                    game=game,
                    answer=answer,
                    time_taken_seconds=time_taken_seconds,
                    reasoning_quality=reasoning_quality,
                )

            except TypeError:

                return score_switch(
                    game,
                    answer,
                )

    if game_type == "ai_vs_you":

        try:

            return score_ai_vs_you(
                game=game,
                answer=answer,
                time_taken_seconds=time_taken_seconds,
                reasoning_quality=reasoning_quality,
                streak_bonus=0,
            )

        except TypeError:

            try:

                return score_ai_vs_you(
                    game=game,
                    answer=answer,
                    time_taken_seconds=time_taken_seconds,
                    reasoning_quality=reasoning_quality,
                )

            except TypeError:

                return score_ai_vs_you(
                    game,
                    answer,
                )

    raise HTTPException(
        status_code=400,
        detail="Unsupported game type.",
    )


# ============================================================
# ACHIEVEMENTS
# ============================================================

ACHIEVEMENTS = {
    "first_game": {
        "name": "First Challenge",
        "description": (
            "Complete your first Game Lab challenge."
        ),
        "xp": 25,
    },
    "case_solver": {
        "name": "Case Solver",
        "description": (
            "Complete five AI Detective cases."
        ),
        "xp": 50,
    },
    "sharp_observer": {
        "name": "Sharp Observer",
        "description": (
            "Build strong observation performance."
        ),
        "xp": 40,
    },
    "logic_master": {
        "name": "Logic Master",
        "description": (
            "Build strong logic performance."
        ),
        "xp": 40,
    },
    "fast_thinker": {
        "name": "Fast Thinker",
        "description": (
            "Solve a challenge quickly."
        ),
        "xp": 30,
    },
    "perfect_case": {
        "name": "Perfect Case",
        "description": (
            "Score 100 on a challenge."
        ),
        "xp": 75,
    },
    "three_day_thinker": {
        "name": "Three Day Thinker",
        "description": (
            "Maintain a three-day Game Lab streak."
        ),
        "xp": 50,
    },
    "seven_day_thinker": {
        "name": "Seven Day Thinker",
        "description": (
            "Maintain a seven-day Game Lab streak."
        ),
        "xp": 100,
    },
    "ai_challenger": {
        "name": "AI Challenger",
        "description": (
            "Complete an AI vs You challenge."
        ),
        "xp": 50,
    },
    "decision_maker": {
        "name": "Decision Maker",
        "description": (
            "Complete an AI Switch challenge."
        ),
        "xp": 50,
    },
}


def evaluate_achievements(
    edu_id: str,
    result: Dict[str, Any],
    results: List[Dict[str, Any]],
    streak: int,
) -> List[Dict[str, Any]]:

    achievements = load_achievements()

    existing = {
        item.get(
            "achievement_id"
        )
        for item in achievements
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.strip().lower()
    }

    user_results = [
        item
        for item in results
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.strip().lower()
    ]

    detective_count = sum(
        1
        for item in user_results
        if item.get(
            "game_type"
        ) == "ai_detective"
    )

    skill_scores = result.get(
        "skill_scores",
        {},
    )

    if not isinstance(
        skill_scores,
        dict,
    ):
        skill_scores = {}

    observation = safe_number(
        skill_scores.get(
            "observation",
            0,
        )
    )

    logic = safe_number(
        skill_scores.get(
            "logic",
            0,
        )
    )

    score = safe_number(
        result.get(
            "score",
            0,
        )
    )

    time_taken = safe_number(
        result.get(
            "time_taken_seconds",
            999999,
        ),
        999999,
    )

    game_type = result.get(
        "game_type"
    )

    checks = {
        "first_game": (
            len(user_results) >= 1
        ),
        "case_solver": (
            detective_count >= 5
        ),
        "sharp_observer": (
            observation >= 20
        ),
        "logic_master": (
            logic >= 20
        ),
        "fast_thinker": (
            time_taken <= 30
        ),
        "perfect_case": (
            score >= 100
        ),
        "three_day_thinker": (
            streak >= 3
        ),
        "seven_day_thinker": (
            streak >= 7
        ),
        "ai_challenger": (
            game_type == "ai_vs_you"
        ),
        "decision_maker": (
            game_type == "ai_switch"
        ),
    }

    earned_now = []

    for achievement_id, condition in checks.items():

        if not condition:
            continue

        if achievement_id in existing:
            continue

        definition = ACHIEVEMENTS[
            achievement_id
        ]

        achievement = {
            "achievement_id": achievement_id,
            "edu_id": edu_id,
            "name": definition["name"],
            "description": definition[
                "description"
            ],
            "xp": definition["xp"],
            "earned_at": utc_now(),
        }

        achievements.append(
            achievement
        )

        earned_now.append(
            achievement
        )

    if earned_now:

        save_achievements(
            achievements
        )

    return earned_now


# ============================================================
# START
# ============================================================

@router.post("/start")
def start_game(
    request: StartGameRequest,
):

    ensure_storage_files()

    edu_id = request.edu_id.strip()

    game_type = normalize_game_type(
        request.game_type
    )

    user_type = normalize_user_type(
        request.user_type
    )

    difficulty = max(
        1,
        min(
            request.difficulty,
            5,
        ),
    )

    results = load_results()

    user_results = [
        item
        for item in results
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.lower()
    ]

    # --------------------------------------------------------
    # Personalization profile
    # --------------------------------------------------------

    profile = {}

    try:

        personalization = get_game_personalization(
            edu_id
        )

        if isinstance(
            personalization,
            dict,
        ):

            profile = personalization.get(
                "thinking_profile",
                {},
            )

            if not isinstance(
                profile,
                dict,
            ):
                profile = {}

    except Exception:

        profile = {}

    # --------------------------------------------------------
    # Generate game
    #
    # IMPORTANT:
    # Your current engine signature is:
    #
    # generate_game(
    #     game_type,
    #     user_type,
    #     difficulty,
    #     profile,
    #     recent_results
    # )
    #
    # No edu_id/category argument.
    # --------------------------------------------------------

    try:

        game = generate_game(
            game_type=game_type,
            user_type=user_type,
            difficulty=difficulty,
            profile=profile,
            recent_results=user_results,
        )

    except TypeError:

        game = generate_game(
            game_type,
            user_type,
            difficulty,
            profile,
            user_results,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Game generation failed: "
                f"{str(exc)}"
            ),
        )

    if not isinstance(
        game,
        dict,
    ):

        raise HTTPException(
            status_code=500,
            detail=(
                "Game engine returned "
                "an invalid game."
            ),
        )

    # --------------------------------------------------------
    # IDs
    # --------------------------------------------------------

    if not game.get(
        "game_id"
    ):

        game["game_id"] = (
            f"GAME-"
            f"{uuid.uuid4().hex[:10].upper()}"
        )

    if not game.get(
        "challenge_id"
    ):

        game["challenge_id"] = (
            f"CH-"
            f"{uuid.uuid4().hex[:8].upper()}"
        )

    game["game_type"] = game_type
    game["user_type"] = user_type

    # --------------------------------------------------------
    # Secure server-side session
    # --------------------------------------------------------

    create_game_session(
        game=game,
        edu_id=edu_id,
        user_type=user_type,
    )

    # --------------------------------------------------------
    # Safe client response
    # --------------------------------------------------------

    safe_game = sanitize_game_for_client(
        game
    )

    safe_game["game_id"] = game[
        "game_id"
    ]

    safe_game["challenge_id"] = game[
        "challenge_id"
    ]

    return {
        "success": True,
        "message": (
            "Game started successfully."
        ),
        "game": safe_game,
    }


# ============================================================
# SUBMIT
# ============================================================

@router.post("/submit")
def submit_game(
    request: SubmitGameRequest,
):

    ensure_storage_files()

    edu_id = request.edu_id.strip()

    challenge_id = (
        request.challenge_id.strip()
    )

    # --------------------------------------------------------
    # Secure lookup
    # --------------------------------------------------------

    session = find_game_session(
        edu_id,
        challenge_id,
    )

    if not session:

        raise HTTPException(
            status_code=404,
            detail=(
                "Game session not found. "
                "Start the game first and use "
                "the challenge_id returned by "
                "/api/games/start."
            ),
        )

    if session.get(
        "submitted"
    ) is True:

        raise HTTPException(
            status_code=409,
            detail=(
                "This challenge has "
                "already been submitted."
            ),
        )

    game = session.get(
        "game"
    )

    if not isinstance(
        game,
        dict,
    ):

        raise HTTPException(
            status_code=500,
            detail=(
                "Stored game session "
                "is invalid."
            ),
        )

    game_type = normalize_game_type(
        str(
            session.get(
                "game_type",
                game.get(
                    "game_type",
                    "",
                ),
            )
        )
    )

    user_type = normalize_user_type(
        str(
            session.get(
                "user_type",
                game.get(
                    "user_type",
                    "general",
                ),
            )
        )
    )

    # --------------------------------------------------------
    # Score
    # --------------------------------------------------------

    try:

        score_data = score_game(
            game_type=game_type,
            game=game,
            answer=request.answer,
            time_taken_seconds=(
                request.time_taken_seconds
            ),
            clue_count=request.clue_count,
            reasoning_quality=(
                request.reasoning_quality
            ),
        )

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Game scoring failed: "
                f"{str(exc)}"
            ),
        )

    if not isinstance(
        score_data,
        dict,
    ):

        raise HTTPException(
            status_code=500,
            detail=(
                "Game engine returned "
                "an invalid score."
            ),
        )

    # --------------------------------------------------------
    # Build result locally
    # --------------------------------------------------------

    score = safe_number(
        score_data.get(
            "score",
            0,
        )
    )

    correct = bool(
        score_data.get(
            "correct",
            False,
        )
    )

    skill_scores = score_data.get(
        "skill_scores",
        {},
    )

    if not isinstance(
        skill_scores,
        dict,
    ):

        skill_scores = {}

    # Compatibility with old engine
    if (
        "decision_making"
        not in skill_scores
        and "decision"
        in skill_scores
    ):

        skill_scores[
            "decision_making"
        ] = skill_scores[
            "decision"
        ]

    result = {
        "result_id": (
            f"GAME-"
            f"{uuid.uuid4().hex[:10].upper()}"
        ),
        "edu_id": edu_id,
        "user_type": user_type,
        "game_id": game.get(
            "game_id"
        ),
        "challenge_id": challenge_id,
        "game_type": game_type,
        "game_name": game.get(
            "game_name",
            game_type,
        ),
        "title": game.get(
            "title",
            "Game Challenge",
        ),
        "category": game.get(
            "category",
            "general",
        ),
        "score": int(
            round(score)
        ),
        "correct": correct,
        "xp": int(
            safe_number(
                score_data.get(
                    "xp",
                    score,
                )
            )
        ),
        "skill_scores": skill_scores,
        "correct_answer": score_data.get(
            "correct_answer"
        ),
        "selected_option": score_data.get(
            "selected_option",
            request.answer,
        ),
        "ai_match": score_data.get(
            "ai_match",
            False,
        ),
        "impact": score_data.get(
            "impact",
            "",
        ),
        "explanation": score_data.get(
            "explanation",
            "",
        ),
        "time_taken_seconds": (
            request.time_taken_seconds
        ),
        "clue_count": (
            request.clue_count
        ),
        "played_at": utc_now(),
    }

    if (
        request.reasoning_quality
        is not None
    ):

        result[
            "reasoning_quality"
        ] = request.reasoning_quality

    # --------------------------------------------------------
    # Save result
    # --------------------------------------------------------

    results = load_results()

    results.append(
        result
    )

    save_results(
        results
    )

    # --------------------------------------------------------
    # Streak
    # --------------------------------------------------------

    streak = calculate_current_streak(
        edu_id,
        results,
    )

    streak_bonus = get_streak_bonus(
        streak
    )

    result["streak"] = streak
    result["streak_bonus"] = (
        streak_bonus
    )

    result["xp"] += streak_bonus

    # --------------------------------------------------------
    # Achievements
    # --------------------------------------------------------

    achievements_earned = (
        evaluate_achievements(
            edu_id=edu_id,
            result=result,
            results=results,
            streak=streak,
        )
    )

    achievement_xp = int(
        sum(
            safe_number(
                item.get(
                    "xp",
                    0,
                )
            )
            for item in achievements_earned
        )
    )

    result["xp"] += achievement_xp

    # --------------------------------------------------------
    # Update final saved result
    # --------------------------------------------------------

    for index in range(
        len(results) - 1,
        -1,
        -1,
    ):

        if (
            results[index].get(
                "result_id"
            )
            == result.get(
                "result_id"
            )
        ):

            results[index] = result
            break

    save_results(
        results
    )

    # --------------------------------------------------------
    # Close session
    # --------------------------------------------------------

    mark_session_submitted(
        edu_id,
        challenge_id,
    )

    # --------------------------------------------------------
    # Summary
    # --------------------------------------------------------

    summary = build_summary(
        edu_id,
        results,
    )

    return {
        "success": True,
        "message": (
            "Game result recorded successfully."
        ),
        "result": result,
        "achievements_earned": (
            achievements_earned
        ),
        "summary": summary,
    }


# ============================================================
# RESULTS
# ============================================================

@router.get("/results/{edu_id}")
def get_game_results(
    edu_id: str,
):

    results = load_results()

    user_results = [
        item
        for item in results
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.strip().lower()
    ]

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(
            user_results
        ),
        "results": list(
            reversed(
                user_results
            )
        ),
    }


# ============================================================
# PROFILE
# ============================================================

@router.get("/profile/{edu_id}")
def get_profile(
    edu_id: str,
):

    results = load_results()

    summary = build_summary(
        edu_id,
        results,
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "profile": summary,
    }


# ============================================================
# SUMMARY
# ============================================================

@router.get("/summary/{edu_id}")
def get_summary(
    edu_id: str,
):

    results = load_results()

    summary = build_summary(
        edu_id,
        results,
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "summary": summary,
    }


# ============================================================
# THINKING PROFILE
# ============================================================

@router.get(
    "/{edu_id}/thinking-profile"
)
def get_thinking_profile_endpoint(
    edu_id: str,
):

    results = load_results()

    user_results = [
        item
        for item in results
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.strip().lower()
    ]

    profile = calculate_thinking_profile(
        user_results
    )

    measured = [
        skill
        for skill, value in profile.items()
        if value > 0
    ]

    unmeasured = [
        skill
        for skill, value in profile.items()
        if value == 0
    ]

    return {
        "success": True,
        "edu_id": edu_id,
        "thinking_profile": profile,
        "measured_skills": measured,
        "unmeasured_skills": unmeasured,
    }


# ============================================================
# PERSONALIZATION
# ============================================================

@router.get(
    "/{edu_id}/personalization"
)
def get_personalization(
    edu_id: str,
):

    try:

        personalization = (
            get_game_personalization(
                edu_id
            )
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Game personalization failed: "
                f"{str(exc)}"
            ),
        )

    try:

        ai_context = (
            build_game_ai_context(
                edu_id
            )
        )

    except Exception:

        ai_context = ""

    return {
        "success": True,
        "edu_id": edu_id,
        "personalization": personalization,
        "ai_context": ai_context,
    }


# ============================================================
# RECOMMENDATION
# ============================================================

@router.get(
    "/{edu_id}/recommendation"
)
def get_recommendation(
    edu_id: str,
):

    try:

        personalization = (
            get_game_personalization(
                edu_id
            )
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Game recommendation failed: "
                f"{str(exc)}"
            ),
        )

    recommendation = {}

    if isinstance(
        personalization,
        dict,
    ):

        recommendation = (
            personalization.get(
                "recommended_game",
                {},
            )
        )

    return {
        "success": True,
        "edu_id": edu_id,
        "recommendation": recommendation,
    }


# ============================================================
# ACHIEVEMENTS
# ============================================================

@router.get(
    "/{edu_id}/achievements"
)
def get_user_achievements(
    edu_id: str,
):

    achievements = (
        load_achievements()
    )

    user_achievements = [
        item
        for item in achievements
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.strip().lower()
    ]

    return {
        "success": True,
        "edu_id": edu_id,
        "count": len(
            user_achievements
        ),
        "achievements": list(
            reversed(
                user_achievements
            )
        ),
    }


# ============================================================
# ANALYTICS
# ============================================================

@router.get(
    "/{edu_id}/analytics"
)
def get_analytics(
    edu_id: str,
):

    results = load_results()

    user_results = [
        item
        for item in results
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.strip().lower()
    ]

    game_types = {}
    categories = {}

    for item in user_results:

        game_type = item.get(
            "game_type",
            "unknown",
        )

        category = item.get(
            "category",
            "general",
        )

        score = safe_number(
            item.get(
                "score",
                0,
            )
        )

        xp = safe_number(
            item.get(
                "xp",
                0,
            )
        )

        if game_type not in game_types:

            game_types[
                game_type
            ] = {
                "games": 0,
                "total_score": 0,
                "total_xp": 0,
            }

        game_types[
            game_type
        ]["games"] += 1

        game_types[
            game_type
        ]["total_score"] += score

        game_types[
            game_type
        ]["total_xp"] += xp

        if category not in categories:

            categories[
                category
            ] = {
                "games": 0,
                "total_score": 0,
                "total_xp": 0,
            }

        categories[
            category
        ]["games"] += 1

        categories[
            category
        ]["total_score"] += score

        categories[
            category
        ]["total_xp"] += xp

    for data in game_types.values():

        if data["games"]:

            data["average_score"] = round(
                data["total_score"]
                / data["games"],
                2,
            )

        else:

            data["average_score"] = 0

    for data in categories.values():

        if data["games"]:

            data["average_score"] = round(
                data["total_score"]
                / data["games"],
                2,
            )

        else:

            data["average_score"] = 0

    return {
        "success": True,
        "edu_id": edu_id,
        "analytics": {
            "total_games": len(
                user_results
            ),
            "game_types": game_types,
            "categories": categories,
        },
    }


# ============================================================
# DAILY MYSTERY
# ============================================================

@router.get(
    "/{edu_id}/daily-mystery"
)
def get_daily_mystery(
    edu_id: str,
):

    results = load_results()

    user_results = [
        item
        for item in results
        if str(
            item.get(
                "edu_id",
                "",
            )
        ).strip().lower()
        == edu_id.strip().lower()
    ]

    recommended = (
        "ai_detective"
    )

    profile = {}

    try:

        personalization = (
            get_game_personalization(
                edu_id
            )
        )

        if isinstance(
            personalization,
            dict,
        ):

            recommendation = (
                personalization.get(
                    "recommended_game",
                    {},
                )
            )

            if isinstance(
                recommendation,
                dict,
            ):

                recommended = recommendation.get(
                    "game_type",
                    recommended,
                )

            profile = (
                personalization.get(
                    "thinking_profile",
                    {},
                )
            )

    except Exception:

        pass

    try:

        game = generate_game(
            game_type=normalize_game_type(
                recommended
            ),
            user_type="general",
            difficulty=2,
            profile=(
                profile
                if isinstance(
                    profile,
                    dict,
                )
                else {}
            ),
            recent_results=user_results,
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Daily mystery generation failed: "
                f"{str(exc)}"
            ),
        )

    return {
        "success": True,
        "edu_id": edu_id,
        "game": sanitize_game_for_client(
            game
        ),
    }


# ============================================================
# HEALTH
# ============================================================

@router.get("/health")
def game_health():

    ensure_storage_files()

    results = load_results()
    sessions = load_sessions()
    achievements = load_achievements()

    active_sessions = sum(
        1
        for item in sessions
        if item.get(
            "submitted"
        ) is not True
    )

    return {
        "success": True,
        "service": "Game Lab",
        "status": "healthy",
        "supported_games": [
            "ai_detective",
            "ai_switch",
            "ai_vs_you",
        ],
        "features": {
            "secure_game_sessions": True,
            "server_side_answers": True,
            "anti_duplicate_submission": True,
            "adaptive_difficulty": True,
            "thinking_profile": True,
            "personalization": True,
            "xp_system": True,
            "streak_system": True,
            "achievements": True,
            "daily_mystery": True,
            "analytics": True,
        },
        "storage": {
            "results": len(
                results
            ),
            "sessions": len(
                sessions
            ),
            "active_sessions": active_sessions,
            "achievements": len(
                achievements
            ),
        },
    }