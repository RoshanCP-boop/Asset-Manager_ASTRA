"""Add needs_data_wipe column to assets table

Revision ID: 002_add_needs_data_wipe
Revises: 001_initial
Create Date: 2026-02-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '002_add_needs_data_wipe'
down_revision: Union[str, Sequence[str], None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('assets', sa.Column('needs_data_wipe', sa.Boolean(), nullable=False, server_default='false'))


def downgrade():
    op.drop_column('assets', 'needs_data_wipe')
