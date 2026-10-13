from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime
import json
import secrets

from backend.app.services.email_service import send_email


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications"],
)


# =========================================================
# PATHS
# =========================================================

BASE_DIR = Path(__file__).resolve().parents[3]

DATA_DIR = BASE_DIR / "data" / "users"

NOTIFICATIONS_FILE = DATA_DIR / "notifications.json"
USERS_FILE = DATA_DIR / "users.json"


# =========================================================
# FILE HELPERS
# =========================================================

def ensure_files():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not NOTIFICATIONS_FILE.exists():
        NOTIFICATIONS_FILE.write_text(
            "[]",
            encoding="utf-8",
        )

    if not USERS_FILE.exists():
        USERS_FILE.write_text(
            "[]",
            encoding="utf-8",
        )


def load_notifications():
    ensure_files()

    try:
        data = json.loads(
            NOTIFICATIONS_FILE.read_text(
                encoding="utf-8",
            )
        )

        return data if isinstance(data, list) else []

    except Exception:
        return []


def save_notifications(notifications):
    ensure_files()

    NOTIFICATIONS_FILE.write_text(
        json.dumps(
            notifications,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def load_users():
    ensure_files()

    try:
        data = json.loads(
            USERS_FILE.read_text(
                encoding="utf-8",
            )
        )

        return data if isinstance(data, list) else []

    except Exception:
        return []


def save_users(users):
    ensure_files()

    USERS_FILE.write_text(
        json.dumps(
            users,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


# =========================================================
# USER HELPERS
# =========================================================

def find_user(edu_id: str):
    users = load_users()

    for user in users:
        if user.get("edu_id") == edu_id:
            return user

    return None


# =========================================================
# ID GENERATOR
# =========================================================

def generate_notification_id():
    return "NOTIF-" + secrets.token_hex(4).upper()


# =========================================================
# REQUEST MODELS
# =========================================================

class NotificationCreateRequest(BaseModel):
    edu_id: str
    title: str
    message: str

    notification_type: str = "general"
    priority: str = "normal"
    channel: str = "in_app"

    related_id: str = ""


class NotificationPreferenceRequest(BaseModel):
    email_notifications: bool = True
    mobile_notifications: bool = True
    browser_notifications: bool = True


# =========================================================
# EMAIL HTML
# =========================================================

def build_email_html(
    title: str,
    message: str,
    edu_id: str,
):
    safe_title = (
        title
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )

    safe_message = (
        message
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("\n", "<br>")
    )

    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">

    <style>
        body {{
            margin: 0;
            padding: 0;
            background: #f3f8f7;
            font-family: Arial, Helvetica, sans-serif;
        }}

        .wrapper {{
            width: 100%;
            padding: 30px 0;
        }}

        .container {{
            max-width: 620px;
            margin: auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        }}

        .header {{
            background: #0f766e;
            color: #ffffff;
            padding: 25px 30px;
        }}

        .brand {{
            font-size: 26px;
            font-weight: bold;
            margin-bottom: 5px;
        }}

        .subtitle {{
            font-size: 13px;
            opacity: 0.9;
        }}

        .content {{
            padding: 30px;
        }}

        .title {{
            color: #134e4a;
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 18px;
        }}

        .message {{
            color: #374151;
            font-size: 15px;
            line-height: 1.7;
        }}

        .edu-id {{
            margin-top: 25px;
            padding: 14px 16px;
            background: #ecfdf5;
            border-radius: 10px;
            color: #065f46;
            font-size: 13px;
        }}

        .footer {{
            padding: 20px 30px;
            background: #f8fafc;
            color: #64748b;
            font-size: 12px;
            text-align: center;
        }}
    </style>
</head>

<body>

<div class="wrapper">

    <div class="container">

        <div class="header">
            <div class="brand">
                EduTrace
            </div>

            <div class="subtitle">
                Personal AI Learning &amp; Productivity Assistant
            </div>
        </div>

        <div class="content">

            <div class="title">
                {safe_title}
            </div>

            <div class="message">
                {safe_message}
            </div>

            <div class="edu-id">
                <strong>EDU ID:</strong> {edu_id}
            </div>

        </div>

        <div class="footer">
            This is an automated notification from EduTrace.
            <br>
            Please do not reply to this email.
        </div>

    </div>

</div>

</body>
</html>
"""


# =========================================================
# EMAIL DELIVERY
# =========================================================

def send_notification_email(
    user_email: str,
    title: str,
    message: str,
    edu_id: str,
):
    email_html = build_email_html(
        title=title,
        message=message,
        edu_id=edu_id,
    )

    return send_email(
        to_email=user_email,
        subject=f"EduTrace - {title}",
        message=message,
        html_message=email_html,
    )


# =========================================================
# INTERNAL NOTIFICATION CREATOR
# =========================================================

def create_notification_internal(
    edu_id: str,
    title: str,
    message: str,
    notification_type: str = "general",
    priority: str = "normal",
    channel: str = "in_app",
    related_id: str = "",
):
    user = find_user(edu_id)

    if not user:
        return {
            "notification_created": False,
            "email": {
                "success": False,
                "status": "user_not_found",
                "message": "Edu ID not found.",
            },
        }

    notifications = load_notifications()

    # =====================================================
    # DUPLICATE PROTECTION
    # =====================================================

    if related_id:

        for existing in notifications:

            if (
                existing.get("edu_id") == edu_id
                and existing.get("notification_type")
                == notification_type
                and existing.get("related_id")
                == related_id
            ):
                return {
                    "notification_created": False,
                    "notification": existing,
                    "email": {
                        "success": False,
                        "status": "duplicate",
                        "message": "Notification already exists.",
                    },
                }

    # =====================================================
    # CREATE NOTIFICATION
    # =====================================================

    notification = {
        "notification_id": generate_notification_id(),
        "edu_id": edu_id,
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "priority": priority,
        "channel": channel,
        "related_id": related_id,
        "read": False,
        "created_at": datetime.now().isoformat(),
    }

    notifications.append(notification)

    save_notifications(notifications)

    # =====================================================
    # EMAIL SETTINGS
    # =====================================================

    preferences = user.get("preferences", {})

    email_enabled = preferences.get(
        "email_notifications",
        True,
    )

    user_email = str(
        user.get("email", "")
    ).strip()

    # =====================================================
    # EMAIL DELIVERY
    # =====================================================

    if not email_enabled:

        email_result = {
            "success": False,
            "status": "disabled_by_user",
            "message": (
                "Email notifications are disabled "
                "in user preferences."
            ),
        }

    elif not user_email:

        email_result = {
            "success": False,
            "status": "email_missing",
            "message": (
                "Email notifications are enabled "
                "but no email address is stored."
            ),
        }

    else:

        try:

            email_result = send_notification_email(
                user_email=user_email,
                title=title,
                message=message,
                edu_id=edu_id,
            )

        except Exception as exc:

            email_result = {
                "success": False,
                "status": "email_exception",
                "message": f"Email delivery failed: {exc}",
            }

    # =====================================================
    # RESPONSE
    # =====================================================

    return {
        "notification_created": True,
        "notification": notification,
        "email": email_result,
    }


# =========================================================
# CREATE NOTIFICATION
# =========================================================

@router.post("")
def create_notification(
    payload: NotificationCreateRequest,
):

    result = create_notification_internal(
        edu_id=payload.edu_id,
        title=payload.title,
        message=payload.message,
        notification_type=payload.notification_type,
        priority=payload.priority,
        channel=payload.channel,
        related_id=payload.related_id,
    )

    if result.get("email", {}).get("status") == "user_not_found":

        raise HTTPException(
            status_code=404,
            detail="Edu ID not found.",
        )

    return result


# =========================================================
# GET USER NOTIFICATIONS
# =========================================================

@router.get("/{edu_id}")
def get_notifications(edu_id: str):

    user = find_user(edu_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Edu ID not found.",
        )

    notifications = load_notifications()

    user_notifications = [
        notification
        for notification in notifications
        if notification.get("edu_id") == edu_id
    ]

    user_notifications.sort(
        key=lambda item: item.get("created_at", ""),
        reverse=True,
    )

    unread_count = sum(
        1
        for notification in user_notifications
        if not notification.get("read", False)
    )

    return {
        "success": True,
        "edu_id": edu_id,
        "notifications": user_notifications,
        "total": len(user_notifications),
        "unread_count": unread_count,
    }


# =========================================================
# MARK ONE AS READ
# =========================================================

@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
):

    notifications = load_notifications()

    for notification in notifications:

        if notification.get("notification_id") == notification_id:

            notification["read"] = True
            notification["read_at"] = datetime.now().isoformat()

            save_notifications(notifications)

            return {
                "success": True,
                "message": "Notification marked as read.",
                "notification": notification,
            }

    raise HTTPException(
        status_code=404,
        detail="Notification not found.",
    )


# =========================================================
# MARK ALL AS READ
# =========================================================

@router.patch("/user/{edu_id}/read-all")
def mark_all_read(edu_id: str):

    user = find_user(edu_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Edu ID not found.",
        )

    notifications = load_notifications()

    count = 0
    now = datetime.now().isoformat()

    for notification in notifications:

        if (
            notification.get("edu_id") == edu_id
            and not notification.get("read", False)
        ):
            notification["read"] = True
            notification["read_at"] = now
            count += 1

    save_notifications(notifications)

    return {
        "success": True,
        "message": f"{count} notification(s) marked as read.",
        "updated_count": count,
    }


# =========================================================
# DELETE ONE
# =========================================================

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
):

    notifications = load_notifications()

    original_count = len(notifications)

    notifications = [
        notification
        for notification in notifications
        if notification.get("notification_id")
        != notification_id
    ]

    if len(notifications) == original_count:

        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    save_notifications(notifications)

    return {
        "success": True,
        "message": "Notification deleted successfully.",
    }


# =========================================================
# CLEAR USER NOTIFICATIONS
# =========================================================

@router.delete("/user/{edu_id}/clear")
def clear_notifications(edu_id: str):

    user = find_user(edu_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Edu ID not found.",
        )

    notifications = load_notifications()

    remaining = [
        notification
        for notification in notifications
        if notification.get("edu_id") != edu_id
    ]

    deleted_count = len(notifications) - len(remaining)

    save_notifications(remaining)

    return {
        "success": True,
        "message": f"{deleted_count} notification(s) cleared.",
        "deleted_count": deleted_count,
    }


# =========================================================
# DEMO NOTIFICATION
# =========================================================

@router.post("/{edu_id}/demo")
def create_demo_notification(
    edu_id: str,
):

    user = find_user(edu_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Edu ID not found.",
        )

    demo_id = "DEMO-" + secrets.token_hex(4).upper()

    result = create_notification_internal(
        edu_id=edu_id,
        title="Welcome to EduTrace",
        message=(
            "Your EduTrace notification system "
            "is working successfully."
        ),
        notification_type="general",
        priority="normal",
        channel="in_app",
        related_id=demo_id,
    )

    return result


# =========================================================
# GET PREFERENCES
# =========================================================

@router.get("/preferences/{edu_id}")
def get_notification_preferences(
    edu_id: str,
):

    user = find_user(edu_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Edu ID not found.",
        )

    preferences = user.get(
        "preferences",
        {
            "email_notifications": True,
            "mobile_notifications": True,
            "browser_notifications": True,
        },
    )

    return {
        "edu_id": edu_id,
        "preferences": preferences,
    }


# =========================================================
# UPDATE PREFERENCES
# =========================================================

@router.put("/preferences/{edu_id}")
def update_notification_preferences(
    edu_id: str,
    payload: NotificationPreferenceRequest,
):

    users = load_users()

    for user in users:

        if user.get("edu_id") == edu_id:

            user["preferences"] = {
                "email_notifications":
                    payload.email_notifications,

                "mobile_notifications":
                    payload.mobile_notifications,

                "browser_notifications":
                    payload.browser_notifications,
            }

            user["updated_at"] = datetime.now().isoformat()

            save_users(users)

            return {
                "success": True,
                "message": (
                    "Notification preferences "
                    "updated successfully."
                ),
                "edu_id": edu_id,
                "preferences": user["preferences"],
            }

    raise HTTPException(
        status_code=404,
        detail="Edu ID not found.",
    )