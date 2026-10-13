import os
import re
import requests
from typing import Optional


MSG91_URL = "https://control.msg91.com/api/v5/flow"


def normalize_indian_mobile(phone: str) -> str:
    """
    Convert common Indian phone formats to 91XXXXXXXXXX.
    """

    if not phone:
        raise ValueError("Mobile number is required.")

    cleaned = re.sub(r"\D", "", str(phone))

    if cleaned.startswith("91") and len(cleaned) == 12:
        return cleaned

    if len(cleaned) == 10:
        return "91" + cleaned

    raise ValueError(
        "Invalid Indian mobile number. Use 10 digits or 91XXXXXXXXXX."
    )


def send_sms(
    phone: str,
    message: str,
    template_id: Optional[str] = None,
    variables: Optional[dict] = None,
) -> dict:
    """
    Send SMS through MSG91.

    IMPORTANT:
    The actual template/variables must match the approved
    MSG91/DLT template configured in the account.
    """

    authkey = os.getenv("MSG91_AUTH_KEY", "").strip()
    configured_template_id = (
        template_id
        or os.getenv("MSG91_TEMPLATE_ID", "").strip()
    )

    enabled = (
        os.getenv("SMS_ENABLED", "false").strip().lower()
        == "true"
    )

    if not enabled:
        return {
            "success": False,
            "status": "disabled",
            "message": "SMS delivery is disabled.",
        }

    if not authkey:
        return {
            "success": False,
            "status": "configuration_error",
            "message": "MSG91_AUTH_KEY is not configured.",
        }

    if not configured_template_id:
        return {
            "success": False,
            "status": "configuration_error",
            "message": "MSG91_TEMPLATE_ID is not configured.",
        }

    try:
        mobile = normalize_indian_mobile(phone)
    except ValueError as exc:
        return {
            "success": False,
            "status": "validation_error",
            "message": str(exc),
        }

    variables = variables or {}

    # MSG91 Flow API payload.
    # The exact variable names must match the approved template.
    payload = {
        "template_id": configured_template_id,
        "short_url": "0",
        "recipients": [
            {
                "mobiles": mobile,
                **variables,
            }
        ],
    }

    headers = {
        "accept": "application/json",
        "authkey": authkey,
        "content-type": "application/json",
    }

    try:
        response = requests.post(
            MSG91_URL,
            json=payload,
            headers=headers,
            timeout=20,
        )

        try:
            provider_response = response.json()
        except ValueError:
            provider_response = {
                "raw": response.text
            }

        if 200 <= response.status_code < 300:
            return {
                "success": True,
                "status": "accepted",
                "message": "SMS request accepted by MSG91.",
                "mobile": mobile,
                "provider_response": provider_response,
            }

        return {
            "success": False,
            "status": "provider_error",
            "message": "MSG91 rejected the SMS request.",
            "http_status": response.status_code,
            "provider_response": provider_response,
        }

    except requests.RequestException as exc:
        return {
            "success": False,
            "status": "network_error",
            "message": f"Unable to connect to MSG91: {exc}",
        }