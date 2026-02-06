"""Add organization settings and employee ID

Revision ID: 004_add_org_settings
Revises: 003_add_categories
Create Date: 2026-02-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_add_org_settings'
down_revision: Union[str, Sequence[str], None] = '003_add_categories'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add columns to organizations table
    op.add_column('organizations', sa.Column('logo_url', sa.String(500), nullable=True))
    op.add_column('organizations', sa.Column('employee_id_prefix', sa.String(20), nullable=True))
    
    # Add employee_id column to users table
    op.add_column('users', sa.Column('employee_id', sa.String(50), nullable=True))
    op.create_index('ix_users_employee_id', 'users', ['employee_id'])


def downgrade():
    op.drop_index('ix_users_employee_id', 'users')
    op.drop_column('users', 'employee_id')
    op.drop_column('organizations', 'employee_id_prefix')
    op.drop_column('organizations', 'logo_url')
