from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pathlib import Path
from io import BytesIO
import json
import qrcode


router = APIRouter(
    prefix="/api/edu-id",
    tags=["Digital EDU ID"]
)


# ============================================================
# Paths
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[3]

USERS_FILE = (
    BASE_DIR
    / "data"
    / "users"
    / "users.json"
)


# ============================================================
# Helpers
# ============================================================

def load_users():

    if not USERS_FILE.exists():
        return []

    try:

        with open(
            USERS_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            return json.load(file)

    except Exception:

        return []


def find_user(edu_id: str):

    users = load_users()

    for user in users:

        if user.get("edu_id") == edu_id:
            return user

    return None


# ============================================================
# Digital EDU ID Information
# ============================================================

@router.get("/{edu_id}")
def get_edu_id(edu_id: str):

    user = find_user(edu_id)

    if not user:

        raise HTTPException(
            status_code=404,
            detail="EDU ID not found."
        )

    return {

        "success": True,

        "edu_id": user.get("edu_id"),

        "name": user.get("name"),

        "email": user.get("email"),

        "user_type": user.get("user_type"),

        "created_at": user.get("created_at"),

        "verification_url":
            f"/api/edu-id/verify/{edu_id}"

    }


# ============================================================
# Generate QR Code
# ============================================================

@router.get("/{edu_id}/qr")
def generate_qr(edu_id: str):

    user = find_user(edu_id)

    if not user:

        raise HTTPException(
            status_code=404,
            detail="EDU ID not found."
        )

    # --------------------------------------------------------
    # QR payload
    # --------------------------------------------------------

    qr_data = json.dumps(
        {
            "platform": "EduTrace",
            "edu_id": user.get("edu_id"),
            "verification":
                f"/api/edu-id/verify/{edu_id}"
        }
    )

    # --------------------------------------------------------
    # Create QR
    # --------------------------------------------------------

    qr = qrcode.QRCode(

        version=1,

        error_correction=
            qrcode.constants.ERROR_CORRECT_M,

        box_size=10,

        border=4

    )

    qr.add_data(qr_data)

    qr.make(
        fit=True
    )

    image = qr.make_image(
        fill_color="black",
        back_color="white"
    )

    # --------------------------------------------------------
    # Convert to PNG
    # --------------------------------------------------------

    buffer = BytesIO()

    image.save(
        buffer,
        format="PNG"
    )

    buffer.seek(0)

    return StreamingResponse(

        buffer,

        media_type="image/png",

        headers={
            "Content-Disposition":
                f'inline; filename="{edu_id}_qr.png"'
        }

    )


# ============================================================
# Verify EDU ID
# ============================================================

@router.get("/verify/{edu_id}")
def verify_edu_id(edu_id: str):

    user = find_user(edu_id)

    if not user:

        return {

            "valid": False,

            "message":
                "This EDU ID does not exist."

        }

    return {

        "valid": True,

        "platform": "EduTrace",

        "edu_id":
            user.get("edu_id"),

        "name":
            user.get("name"),

        "user_type":
            user.get("user_type"),

        "message":
            "EduTrace Digital ID verified."

    }