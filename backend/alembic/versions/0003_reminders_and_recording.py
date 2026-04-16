"""reminders and recording support

Revision ID: 0003_reminders_and_recording
Revises: 0002_user_availability
Create Date: 2026-04-15 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "0003_reminders_and_recording"
down_revision = "0002_user_availability"
branch_labels = None
depends_on = None


reminder_channel_enum = sa.Enum("email", "whatsapp", name="reminder_channel")
reminder_status_enum = sa.Enum("pending", "sent", "failed", name="reminder_status")


def upgrade() -> None:
    op.add_column("demos", sa.Column("recording_url", sa.String(length=500), nullable=True))
    op.add_column("demos", sa.Column("recording_notes", sa.Text(), nullable=True))
    op.add_column("demos", sa.Column("recording_uploaded_at", sa.DateTime(), nullable=True))

    op.create_table(
        "demo_reminders",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("demo_id", sa.Integer(), sa.ForeignKey("demos.id"), nullable=False),
        sa.Column("channel", reminder_channel_enum, nullable=False),
        sa.Column("remind_at", sa.DateTime(), nullable=False),
        sa.Column("status", reminder_status_enum, nullable=False, server_default="pending"),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_demo_reminders_id"), "demo_reminders", ["id"], unique=False)
    op.create_index(op.f("ix_demo_reminders_demo_id"), "demo_reminders", ["demo_id"], unique=False)
    op.create_index(op.f("ix_demo_reminders_status"), "demo_reminders", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_demo_reminders_status"), table_name="demo_reminders")
    op.drop_index(op.f("ix_demo_reminders_demo_id"), table_name="demo_reminders")
    op.drop_index(op.f("ix_demo_reminders_id"), table_name="demo_reminders")
    op.drop_table("demo_reminders")

    op.drop_column("demos", "recording_uploaded_at")
    op.drop_column("demos", "recording_notes")
    op.drop_column("demos", "recording_url")

    reminder_status_enum.drop(op.get_bind(), checkfirst=True)
    reminder_channel_enum.drop(op.get_bind(), checkfirst=True)
