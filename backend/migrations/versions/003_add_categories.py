"""Add categories table for dynamic asset categories

Revision ID: 003_add_categories
Revises: 002_add_needs_data_wipe
Create Date: 2026-02-05
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_add_categories'
down_revision: Union[str, Sequence[str], None] = '002_add_needs_data_wipe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True, index=True),
        sa.Column('category_type', sa.String(50), nullable=False, index=True),
        sa.Column('display_name', sa.String(100), nullable=False),
    )
    
    # Seed default categories
    op.execute("""
        INSERT INTO categories (name, category_type, display_name) VALUES
        ('LAPTOP', 'HARDWARE', 'Laptop'),
        ('PHONE', 'HARDWARE', 'Phone'),
        ('MONITOR', 'HARDWARE', 'Monitor'),
        ('TABLET', 'HARDWARE', 'Tablet'),
        ('OTHER', 'HARDWARE', 'Other'),
        ('MOUSE', 'ACCESSORY', 'Mouse'),
        ('KEYBOARD', 'ACCESSORY', 'Keyboard'),
        ('HEADSET', 'ACCESSORY', 'Headset'),
        ('WEBCAM', 'ACCESSORY', 'Webcam'),
        ('DOCKING_STATION', 'ACCESSORY', 'Docking Station'),
        ('CHARGER', 'ACCESSORY', 'Charger'),
        ('CABLE', 'ACCESSORY', 'Cable'),
        ('OTHER_ACCESSORY', 'ACCESSORY', 'Other Accessory')
    """)


def downgrade():
    op.drop_table('categories')
