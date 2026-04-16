"""user availability table

Revision ID: 0002_user_availability
Revises: 0001_initial
Create Date: 2026-04-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "0002_user_availability"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_availabilities",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("is_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("day_of_week >= 0 AND day_of_week <= 6", name="ck_user_availabilities_day_of_week"),
    )
    op.create_index(op.f("ix_user_availabilities_id"), "user_availabilities", ["id"], unique=False)
    op.create_index(op.f("ix_user_availabilities_user_id"), "user_availabilities", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_user_availabilities_user_id"), table_name="user_availabilities")
    op.drop_index(op.f("ix_user_availabilities_id"), table_name="user_availabilities")
    op.drop_table("user_availabilities")
