"""Add multi-tenancy support

Revision ID: a1b2c3d4e5f6
Revises: 17413a412654
Create Date: 2026-01-29

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '17413a412654'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=200), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=True),
        sa.Column('is_personal', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_organizations_domain', 'organizations', ['domain'], unique=True)

    # Create invite_codes table
    op.create_table(
        'invite_codes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('created_by_user_id', sa.Integer(), nullable=False),
        sa.Column('max_uses', sa.Integer(), nullable=True),
        sa.Column('uses', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_invite_codes_code', 'invite_codes', ['code'], unique=True)
    op.create_index('ix_invite_codes_organization_id', 'invite_codes', ['organization_id'])

    # Add organization_id to users table
    op.add_column('users', sa.Column('organization_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_users_organization', 'users', 'organizations', ['organization_id'], ['id'])
    op.create_index('ix_users_organization_id', 'users', ['organization_id'])

    # Add organization_id to assets table
    op.add_column('assets', sa.Column('organization_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_assets_organization', 'assets', 'organizations', ['organization_id'], ['id'])
    op.create_index('ix_assets_organization_id', 'assets', ['organization_id'])


def downgrade() -> None:
    # Remove organization_id from assets
    op.drop_index('ix_assets_organization_id', 'assets')
    op.drop_constraint('fk_assets_organization', 'assets', type_='foreignkey')
    op.drop_column('assets', 'organization_id')

    # Remove organization_id from users
    op.drop_index('ix_users_organization_id', 'users')
    op.drop_constraint('fk_users_organization', 'users', type_='foreignkey')
    op.drop_column('users', 'organization_id')

    # Drop invite_codes table
    op.drop_index('ix_invite_codes_organization_id', 'invite_codes')
    op.drop_index('ix_invite_codes_code', 'invite_codes')
    op.drop_table('invite_codes')

    # Drop organizations table
    op.drop_index('ix_organizations_domain', 'organizations')
    op.drop_table('organizations')
