"""Support staff QR credentials, profile photos and building access history."""
from alembic import op
import sqlalchemy as sa

revision = "9e8a4c1d7b20"
down_revision = "6b1c2a9d4f31"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("photo_data", sa.Text(), nullable=True))
    op.add_column("qr_codes", sa.Column("staff_school_id", sa.Integer(), nullable=True))
    op.alter_column("qr_codes", "student_id", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key("qr_codes_staff_school_id_fkey", "qr_codes", "users", ["staff_school_id"], ["school_id"], ondelete="CASCADE")
    op.create_index("ix_qr_codes_staff_school_id", "qr_codes", ["staff_school_id"])
    op.create_check_constraint("ck_qr_codes_exactly_one_owner", "qr_codes", "(student_id IS NOT NULL AND staff_school_id IS NULL) OR (student_id IS NULL AND staff_school_id IS NOT NULL)")
    op.add_column("verification_logs", sa.Column("subject_school_id", sa.Integer(), nullable=True))
    op.add_column("verification_logs", sa.Column("phase", sa.String(length=20), nullable=True))
    op.create_foreign_key("verification_logs_subject_school_id_fkey", "verification_logs", "users", ["subject_school_id"], ["school_id"], ondelete="SET NULL")
    op.create_index("ix_verification_logs_subject_school_id", "verification_logs", ["subject_school_id"])
    op.execute("UPDATE verification_logs AS log SET subject_school_id = student.user_id FROM students AS student WHERE log.student_id = student.id")


def downgrade() -> None:
    op.drop_index("ix_verification_logs_subject_school_id", table_name="verification_logs")
    op.drop_constraint("verification_logs_subject_school_id_fkey", "verification_logs", type_="foreignkey")
    op.drop_column("verification_logs", "phase")
    op.drop_column("verification_logs", "subject_school_id")
    op.drop_constraint("ck_qr_codes_exactly_one_owner", "qr_codes", type_="check")
    op.drop_index("ix_qr_codes_staff_school_id", table_name="qr_codes")
    op.drop_constraint("qr_codes_staff_school_id_fkey", "qr_codes", type_="foreignkey")
    op.drop_column("qr_codes", "staff_school_id")
    op.alter_column("qr_codes", "student_id", existing_type=sa.Integer(), nullable=False)
    op.drop_column("users", "photo_data")
