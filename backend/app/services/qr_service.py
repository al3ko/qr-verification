import base64
import hashlib
import io
import secrets
from datetime import datetime, timedelta, timezone

import qrcode


def generate_qr_token() -> str:
    """Generate a cryptographically secure QR credential."""
    return secrets.token_urlsafe(32)


def hash_qr_token(token: str) -> str:
    """Hash a QR token before storing it in the database."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_qr_image(token: str) -> str:
    """Return a QR image as a Base64 data URL."""
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=4,
    )
    qr.add_data(token)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    encoded_image = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded_image}"


def get_qr_expiry() -> datetime:
    """Set the QR credential to expire after 24 hours."""
    return datetime.now(timezone.utc) + timedelta(hours=24)