from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from pathlib import Path
from datetime import datetime
import hashlib
import json
import secrets
import string
import os

from backend.app.services.activity_service import (
    record_activity
)

from backend.app.services.admin_service import (
    create_auth_token
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[3]

DATA_DIR = BASE_DIR / "data" / "users"
USERS_FILE = DATA_DIR / "users.json"


# =========================================================
# FILE HELPERS
# =========================================================

def ensure_users_file():
    DATA_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    if not USERS_FILE.exists():
        USERS_FILE.write_text(
            "[]",
            encoding="utf-8"
        )


def load_users():
    ensure_users_file()

    try:
        data = json.loads(
            USERS_FILE.read_text(
                encoding="utf-8"
            )
        )

        if isinstance(data, list):
            return data

        return []

    except Exception:
        return []


def save_users(users):
    ensure_users_file()

    USERS_FILE.write_text(
        json.dumps(
            users,
            indent=2,
            ensure_ascii=False
        ),
        encoding="utf-8"
    )


# =========================================================
# PASSWORD
# =========================================================

def hash_password(password: str) -> str:
    return hashlib.sha256(
        password.encode("utf-8")
    ).hexdigest()


# =========================================================
# ADMIN
# =========================================================

def is_admin_user(user):
    admin_email = os.getenv(
        "ADMIN_EMAIL",
        ""
    ).strip().lower()

    user_email = (
        user.get("email", "")
        .strip()
        .lower()
    )

    if (
        admin_email
        and user_email == admin_email
    ):
        return True

    return user.get(
        "role",
        "user"
    ) == "admin"


def apply_admin_role(user):
    if is_admin_user(user):
        user["role"] = "admin"
    else:
        user["role"] = user.get(
            "role",
            "user"
        )

    return user


# =========================================================
# EDU ID GENERATOR
# =========================================================

def generate_edu_id(users):

    year = datetime.now().year

    existing_ids = {
        user.get("edu_id")
        for user in users
    }

    while True:

        random_part = "".join(
            secrets.choice(
                string.ascii_uppercase
                + string.digits
            )
            for _ in range(6)
        )

        edu_id = (
            f"EDU-{year}-{random_part}"
        )

        if edu_id not in existing_ids:
            return edu_id


# =========================================================
# REQUEST MODELS
# =========================================================

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    user_type: str = "student"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdateRequest(BaseModel):
    phone: str = ""
    location: str = ""
    institution: str = ""
    organization: str = ""
    course: str = ""
    occupation: str = ""
    skills: list[str] = []
    interests: list[str] = []


# =========================================================
# RESPONSE HELPER
# =========================================================

def public_user(user: dict) -> dict:

    apply_admin_role(user)

    return {
        "edu_id": user.get("edu_id"),

        "name": user.get("name"),

        "email": user.get("email"),

        "user_type": user.get(
            "user_type",
            "student"
        ),

        "role": user.get(
            "role",
            "user"
        ),

        "profile": user.get(
            "profile",
            {
                "phone": "",
                "location": "",
                "institution": "",
                "organization": "",
                "course": "",
                "occupation": "",
                "skills": [],
                "interests": [],
            }
        ),

        "preferences": user.get(
            "preferences",
            {
                "email_notifications": True,
                "mobile_notifications": True,
                "browser_notifications": True,
            }
        ),

        "created_at": user.get(
            "created_at"
        ),

        "updated_at": user.get(
            "updated_at"
        ),
    }


# =========================================================
# REGISTER
# =========================================================

@router.post("/register")
def register_user(
    payload: RegisterRequest
):

    users = load_users()

    allowed_types = {
        "student",
        "working_professional",
        "general"
    }

    user_type = (
        payload.user_type
        .strip()
        .lower()
    )

    if user_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid user_type. Use "
                "student, working_professional "
                "or general."
            )
        )

    email = (
        payload.email
        .lower()
        .strip()
    )

    for user in users:

        if (
            user.get("email", "").lower()
            == email
        ):

            raise HTTPException(
                status_code=409,
                detail="Email already registered."
            )

    if len(payload.password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain "
                "at least 6 characters."
            )
        )

    now = datetime.now().isoformat()

    edu_id = generate_edu_id(users)

    user = {
        "edu_id": edu_id,

        "name": payload.name.strip(),

        "email": email,

        "password_hash": hash_password(
            payload.password
        ),

        "user_type": user_type,

        "role": "user",

        "created_at": now,

        "updated_at": now,

        "profile": {
            "phone": "",
            "location": "",
            "institution": "",
            "organization": "",
            "course": "",
            "occupation": "",
            "skills": [],
            "interests": [],
        },

        "preferences": {
            "email_notifications": True,
            "mobile_notifications": True,
            "browser_notifications": True,
        },
    }

    apply_admin_role(user)

    users.append(user)

    save_users(users)

    record_activity(
        edu_id=edu_id,
        activity_type="registration",
        description=(
            "Account created successfully."
        ),
        metadata={
            "user_type": user_type,
            "email": email,
        },
    )

    token = create_auth_token(user)

    return {
        "success": True,

        "message": (
            "Registration successful."
        ),

        "token": token,

        "user": public_user(user),
    }


# =========================================================
# LOGIN
# =========================================================

@router.post("/login")
def login_user(
    payload: LoginRequest
):

    users = load_users()

    email = (
        payload.email
        .lower()
        .strip()
    )

    password_hash = hash_password(
        payload.password
    )

    for user in users:

        if (
            user.get("email", "").lower()
            == email
            and user.get("password_hash")
            == password_hash
        ):

            apply_admin_role(user)

            record_activity(
                edu_id=user.get("edu_id"),
                activity_type="login",
                description=(
                    "User signed in successfully."
                ),
                metadata={
                    "email": user.get("email"),
                    "role": user.get(
                        "role",
                        "user"
                    ),
                },
            )

            token = create_auth_token(
                user
            )

            return {
                "success": True,

                "message": (
                    "Login successful."
                ),

                "token": token,

                "user": public_user(user),
            }

    raise HTTPException(
        status_code=401,
        detail="Invalid email or password."
    )


# =========================================================
# GET USER BY EDU ID
# =========================================================

@router.get("/user/{edu_id}")
def get_user(
    edu_id: str
):

    users = load_users()

    for user in users:

        if user.get("edu_id") == edu_id:

            return {
                "success": True,
                "user": public_user(user),
            }

    raise HTTPException(
        status_code=404,
        detail="Edu ID not found."
    )


# =========================================================
# UPDATE USER PROFILE
# =========================================================

@router.put("/profile/{edu_id}")
def update_profile(
    edu_id: str,
    payload: ProfileUpdateRequest
):

    users = load_users()

    for user in users:

        if user.get("edu_id") == edu_id:

            existing_profile = user.get(
                "profile",
                {}
            )

            user["profile"] = {
                "phone": (
                    payload.phone.strip()
                    if payload.phone
                    else existing_profile.get(
                        "phone",
                        ""
                    )
                ),

                "location": (
                    payload.location.strip()
                    if payload.location
                    else existing_profile.get(
                        "location",
                        ""
                    )
                ),

                "institution": (
                    payload.institution.strip()
                    if payload.institution
                    else existing_profile.get(
                        "institution",
                        ""
                    )
                ),

                "organization": (
                    payload.organization.strip()
                    if payload.organization
                    else existing_profile.get(
                        "organization",
                        ""
                    )
                ),

                "course": (
                    payload.course.strip()
                    if payload.course
                    else existing_profile.get(
                        "course",
                        ""
                    )
                ),

                "occupation": (
                    payload.occupation.strip()
                    if payload.occupation
                    else existing_profile.get(
                        "occupation",
                        ""
                    )
                ),

                "skills": (
                    payload.skills
                    if payload.skills
                    else existing_profile.get(
                        "skills",
                        []
                    )
                ),

                "interests": (
                    payload.interests
                    if payload.interests
                    else existing_profile.get(
                        "interests",
                        []
                    )
                ),
            }

            user["updated_at"] = (
                datetime.now().isoformat()
            )

            if "preferences" not in user:

                user["preferences"] = {
                    "email_notifications": True,
                    "mobile_notifications": True,
                    "browser_notifications": True,
                }

            save_users(users)

            record_activity(
                edu_id=edu_id,
                activity_type="profile_update",
                description=(
                    "Profile information updated."
                ),
            )

            return {
                "success": True,

                "message": (
                    "Profile updated successfully."
                ),

                "user": public_user(user),
            }

    raise HTTPException(
        status_code=404,
        detail="Edu ID not found."
    )