import base64
import hashlib
import hmac
import json
import os
from datetime import datetime, timedelta, timezone


TOKEN_EXPIRY_HOURS = 24


def _get_secret():
    secret = os.getenv(
        "EDUTRACE_AUTH_SECRET",
        "change-this-edutrace-secret"
    )

    return secret.encode("utf-8")


def _encode(data):
    raw = json.dumps(
        data,
        separators=(",", ":"),
        sort_keys=True
    ).encode("utf-8")

    return base64.urlsafe_b64encode(
        raw
    ).decode("utf-8").rstrip("=")


def _decode(value):
    padding = "=" * (
        4 - len(value) % 4
    )

    raw = base64.urlsafe_b64decode(
        value + padding
    )

    return json.loads(
        raw.decode("utf-8")
    )


def create_auth_token(user):
    now = datetime.now(timezone.utc)

    payload = {
        "edu_id": user.get("edu_id"),
        "email": user.get("email"),
        "role": user.get("role", "user"),
        "iat": int(now.timestamp()),
        "exp": int(
            (
                now
                + timedelta(
                    hours=TOKEN_EXPIRY_HOURS
                )
            ).timestamp()
        ),
    }

    encoded_payload = _encode(payload)

    signature = hmac.new(
        _get_secret(),
        encoded_payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return (
        f"{encoded_payload}.{signature}"
    )


def verify_auth_token(token):
    if not token:
        return None

    try:
        parts = token.split(".")

        if len(parts) != 2:
            return None

        encoded_payload, signature = parts

        expected_signature = hmac.new(
            _get_secret(),
            encoded_payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(
            signature,
            expected_signature
        ):
            return None

        payload = _decode(
            encoded_payload
        )

        if payload.get("exp", 0) < int(
            datetime.now(
                timezone.utc
            ).timestamp()
        ):
            return None

        return payload

    except Exception:
        return None