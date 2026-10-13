import os
import smtplib
from email.message import EmailMessage
from typing import Optional


def send_email(
    to_email: str,
    subject: str,
    message: str,
    html_message: Optional[str] = None,
) -> dict:
    """
    Send an email using SMTP.

    Required environment variables:
        EMAIL_ENABLED=true
        SMTP_HOST=smtp.gmail.com
        SMTP_PORT=587
        SMTP_USERNAME=your-email@gmail.com
        SMTP_PASSWORD=your-gmail-app-password
        EMAIL_FROM=your-email@gmail.com
    """

    enabled = os.getenv("EMAIL_ENABLED", "false").strip().lower() == "true"

    if not enabled:
        return {
            "success": False,
            "status": "disabled",
            "message": "Email delivery is disabled.",
        }

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587").strip())
    smtp_username = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    email_from = os.getenv("EMAIL_FROM", smtp_username).strip()

    if not smtp_username:
        return {
            "success": False,
            "status": "configuration_error",
            "message": "SMTP_USERNAME is not configured.",
        }

    if not smtp_password:
        return {
            "success": False,
            "status": "configuration_error",
            "message": "SMTP_PASSWORD is not configured.",
        }

    if not to_email:
        return {
            "success": False,
            "status": "validation_error",
            "message": "Recipient email address is required.",
        }

    try:
        email = EmailMessage()

        email["From"] = email_from
        email["To"] = to_email
        email["Subject"] = subject

        email.set_content(message)

        if html_message:
            email.add_alternative(
                html_message,
                subtype="html"
            )

        with smtplib.SMTP(
            smtp_host,
            smtp_port,
            timeout=20
        ) as server:

            server.ehlo()
            server.starttls()
            server.ehlo()

            server.login(
                smtp_username,
                smtp_password
            )

            server.send_message(email)

        return {
            "success": True,
            "status": "sent",
            "message": "Email sent successfully.",
            "recipient": to_email,
        }

    except smtplib.SMTPAuthenticationError:
        return {
            "success": False,
            "status": "authentication_error",
            "message": (
                "SMTP authentication failed. "
                "Check the Gmail address and App Password."
            ),
        }

    except smtplib.SMTPException as exc:
        return {
            "success": False,
            "status": "smtp_error",
            "message": f"SMTP error: {exc}",
        }

    except Exception as exc:
        return {
            "success": False,
            "status": "error",
            "message": f"Unable to send email: {exc}",
        }