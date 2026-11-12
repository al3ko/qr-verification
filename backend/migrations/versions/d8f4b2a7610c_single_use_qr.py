"""Make QR credentials single-use and add consumed timestamp."""
from alembic import op
import sqlalchemy as sa

revision = "d8f4b2a7610c"
down_revision = "9e8a4c1d7b20"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("qr_codes", sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("qr_codes", "consumed_at")