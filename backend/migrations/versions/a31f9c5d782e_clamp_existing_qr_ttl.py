"""Clamp already-issued QR credentials to the new 90-second lifetime."""
from alembic import op
import sqlalchemy as sa

revision = "a31f9c5d782e"
down_revision = "d8f4b2a7610c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("""
        UPDATE qr_codes
        SET expires_at = LEAST(expires_at, created_at + INTERVAL '90 seconds')
        WHERE expires_at IS NOT NULL
          AND is_revoked = FALSE
          AND consumed_at IS NULL
    """))


def downgrade() -> None:
    pass