"""School ID becomes the user primary key; add registration and approval fields."""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "6b1c2a9d4f31"
down_revision: Union[str, Sequence[str], None] = "c70a64ec6458"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    DO $$
    BEGIN
      IF (SELECT count(*) FROM users) <> 3
         OR NOT EXISTS (SELECT 1 FROM users WHERE id=1 AND role='student')
         OR NOT EXISTS (SELECT 1 FROM users WHERE id=2 AND role='admin')
         OR NOT EXISTS (SELECT 1 FROM users WHERE id=3 AND role='staff') THEN
        RAISE EXCEPTION 'Legacy users changed; review School ID mappings before migrating';
      END IF;
    END $$;
    """)
    op.add_column("users", sa.Column("school_id", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("first_name", sa.String(75), nullable=True))
    op.add_column("users", sa.Column("last_name", sa.String(75), nullable=True))
    op.add_column("users", sa.Column("gender", sa.String(30), nullable=True))
    op.add_column("users", sa.Column("phone_number", sa.String(30), nullable=True))
    op.add_column("users", sa.Column("work_role", sa.String(40), nullable=True))
    op.add_column("users", sa.Column("head_school", sa.String(100), nullable=True))
    op.execute("""
      UPDATE users
      SET school_id=CASE id WHEN 1 THEN 162437 WHEN 2 THEN 123 WHEN 3 THEN 12345 END,
          first_name=split_part(full_name, ' ', 1),
          last_name=CASE WHEN position(' ' in full_name)>0
            THEN substring(full_name from position(' ' in full_name)+1) ELSE '' END
    """)
    op.add_column("students", sa.Column("school", sa.String(120), nullable=True))
    op.add_column("students", sa.Column("degree", sa.String(160), nullable=True))
    op.add_column("students", sa.Column("group_name", sa.String(80), nullable=True))
    op.add_column("students", sa.Column(
        "approval_status", sa.String(20), nullable=False, server_default="approved"
    ))
    op.add_column("students", sa.Column("rejection_reason", sa.Text(), nullable=True))
    op.add_column("students", sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("students", sa.Column("approved_by", sa.Integer(), nullable=True))

    op.drop_constraint("students_user_id_fkey", "students", type_="foreignkey")
    op.drop_constraint("verification_logs_verified_by_fkey", "verification_logs", type_="foreignkey")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.execute("UPDATE students SET user_id=162437 WHERE user_id=1")
    op.execute("""UPDATE verification_logs SET verified_by=CASE verified_by
      WHEN 1 THEN 162437 WHEN 2 THEN 123 WHEN 3 THEN 12345 ELSE verified_by END""")
    op.drop_constraint("users_pkey", "users", type_="primary")
    op.drop_column("users", "id")
    op.alter_column("users", "school_id", nullable=False)
    op.create_primary_key("users_pkey", "users", ["school_id"])
    op.create_index("ix_users_school_id", "users", ["school_id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=False)
    op.create_foreign_key("students_user_id_fkey", "students", "users",
        ["user_id"], ["school_id"], ondelete="CASCADE")
    op.create_foreign_key("verification_logs_verified_by_fkey", "verification_logs", "users",
        ["verified_by"], ["school_id"], ondelete="RESTRICT")
    op.create_foreign_key("students_approved_by_fkey", "students", "users",
        ["approved_by"], ["school_id"], ondelete="SET NULL")
    op.create_check_constraint("ck_users_school_id_role_range", "users", """
      (role='student' AND school_id BETWEEN 100000 AND 500000)
      OR (role='staff' AND school_id BETWEEN 1001 AND 99999)
      OR (role='admin' AND school_id BETWEEN 100 AND 1000)
    """)
    op.create_check_constraint("ck_students_approval_status", "students",
        "approval_status IN ('pending','approved','rejected')")


def downgrade() -> None:
    op.drop_constraint("ck_students_approval_status", "students", type_="check")
    op.drop_constraint("ck_users_school_id_role_range", "users", type_="check")
    op.drop_constraint("students_approved_by_fkey", "students", type_="foreignkey")
    op.drop_constraint("verification_logs_verified_by_fkey", "verification_logs", type_="foreignkey")
    op.drop_constraint("students_user_id_fkey", "students", type_="foreignkey")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_school_id", table_name="users")
    op.drop_constraint("users_pkey", "users", type_="primary")
    op.add_column("users", sa.Column("id", sa.Integer(), nullable=True))
    op.execute("UPDATE users SET id=school_id")
    op.alter_column("users", "id", nullable=False)
    op.create_primary_key("users_pkey", "users", ["id"])
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_foreign_key("students_user_id_fkey", "students", "users",
        ["user_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("verification_logs_verified_by_fkey", "verification_logs", "users",
        ["verified_by"], ["id"], ondelete="RESTRICT")
    for name in ("approved_by","approved_at","rejection_reason","approval_status",
                 "group_name","degree","school"):
        op.drop_column("students", name)
    for name in ("head_school","work_role","phone_number","gender","last_name",
                 "first_name","school_id"):
        op.drop_column("users", name)

