"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-04-14 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


role_enum = sa.Enum("admin", "sales", "technical", "management", name="user_role")
demo_type_enum = sa.Enum("online", "offline", name="demo_type")
meeting_provider_enum = sa.Enum("google_meet", "zoom", "teams", name="meeting_provider")
demo_status_enum = sa.Enum("new", "scheduled", "confirmed", "completed", "follow_up", "converted", "lost", name="demo_status")
priority_enum = sa.Enum("low", "medium", "high", name="priority")
task_status_enum = sa.Enum("open", "in_progress", "done", name="task_status")
requirement_status_enum = sa.Enum("new", "planned", "in_progress", "shipped", "rejected", name="requirement_status")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False, unique=True, index=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", role_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "demos",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("product_interest", sa.String(length=50), nullable=False),
        sa.Column("company_name", sa.String(length=150), nullable=False),
        sa.Column("contact_name", sa.String(length=120), nullable=False),
        sa.Column("contact_email", sa.String(length=255), nullable=False),
        sa.Column("contact_phone", sa.String(length=30), nullable=True),
        sa.Column("preferred_datetime", sa.DateTime(), nullable=True),
        sa.Column("final_datetime", sa.DateTime(), nullable=True),
        sa.Column("demo_type", demo_type_enum, nullable=False),
        sa.Column("use_case_notes", sa.Text(), nullable=True),
        sa.Column("status", demo_status_enum, nullable=False, server_default="new"),
        sa.Column("sales_rep_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("technical_presenter_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("meeting_provider", meeting_provider_enum, nullable=True),
        sa.Column("meeting_link", sa.String(length=500), nullable=True),
        sa.Column("client_feedback", sa.Text(), nullable=True),
        sa.Column("pain_points", sa.Text(), nullable=True),
        sa.Column("requirements_notes", sa.Text(), nullable=True),
        sa.Column("budget_signals", sa.Text(), nullable=True),
        sa.Column("expected_timeline", sa.String(length=120), nullable=True),
        sa.Column("lost_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_demos_id"), "demos", ["id"], unique=False)

    op.create_table(
        "action_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("demo_id", sa.Integer(), sa.ForeignKey("demos.id"), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("owner", sa.String(length=120), nullable=False),
        sa.Column("deadline", sa.DateTime(), nullable=True),
        sa.Column("priority", priority_enum, nullable=False, server_default="medium"),
        sa.Column("status", task_status_enum, nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_action_items_id"), "action_items", ["id"], unique=False)
    op.create_index(op.f("ix_action_items_demo_id"), "action_items", ["demo_id"], unique=False)

    op.create_table(
        "requirements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("demo_id", sa.Integer(), sa.ForeignKey("demos.id"), nullable=False),
        sa.Column("title", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("assigned_team", sa.String(length=120), nullable=True),
        sa.Column("priority", priority_enum, nullable=False, server_default="medium"),
        sa.Column("status", requirement_status_enum, nullable=False, server_default="new"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(op.f("ix_requirements_id"), "requirements", ["id"], unique=False)
    op.create_index(op.f("ix_requirements_demo_id"), "requirements", ["demo_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_requirements_demo_id"), table_name="requirements")
    op.drop_index(op.f("ix_requirements_id"), table_name="requirements")
    op.drop_table("requirements")

    op.drop_index(op.f("ix_action_items_demo_id"), table_name="action_items")
    op.drop_index(op.f("ix_action_items_id"), table_name="action_items")
    op.drop_table("action_items")

    op.drop_index(op.f("ix_demos_id"), table_name="demos")
    op.drop_table("demos")

    op.drop_table("users")

    requirement_status_enum.drop(op.get_bind(), checkfirst=True)
    task_status_enum.drop(op.get_bind(), checkfirst=True)
    priority_enum.drop(op.get_bind(), checkfirst=True)
    demo_status_enum.drop(op.get_bind(), checkfirst=True)
    meeting_provider_enum.drop(op.get_bind(), checkfirst=True)
    demo_type_enum.drop(op.get_bind(), checkfirst=True)
    role_enum.drop(op.get_bind(), checkfirst=True)
