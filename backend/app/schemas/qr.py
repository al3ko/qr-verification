from datetime import datetime

from pydantic import BaseModel


class QRCodeResponse(BaseModel):
    qr_code_id: int
    qr_token: str
    qr_image: str
    expires_at: datetime
    message: str