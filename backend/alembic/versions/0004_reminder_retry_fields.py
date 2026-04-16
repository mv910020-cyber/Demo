"""add reminder retry fields

Revision ID: 0004_reminder_retry_fields
Revises: 0003_reminders_and_recording
Create Date: 2026-04-15 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "0004_reminder_retry_fields"
down_revision = "0003_reminders_and_recording"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("demo_reminders", sa.Column("attempt_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("demo_reminders", sa.Column("max_attempts", sa.Integer(), nullable=False, server_default="3"))


def downgrade() -> None:
    op.drop_column("demo_reminders", "max_attempts")
    op.drop_column("demo_reminders", "attempt_count")
