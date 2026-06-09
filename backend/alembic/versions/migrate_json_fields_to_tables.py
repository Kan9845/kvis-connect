"""migrate_json_fields_to_tables

Revision ID: a1b2c3d4e5f6
Revises: 3a7f2c9e1b84
Create Date: 2026-06-09

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel

revision = 'a1b2c3d4e5f6'
down_revision = '3a7f2c9e1b84'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column('user', 'projects')
    op.drop_column('user', 'publications')
    op.drop_column('user', 'portfolio_links')
    op.drop_column('user', 'extra_contacts')
    op.drop_column('user', 'languages')
    op.drop_column('user', 'research_interests')

    op.create_table('project',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('title', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('advisor', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('advisor2', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('description', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('status', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='ongoing'),
        sa.Column('link', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_project_user_id', 'project', ['user_id'], unique=False)

    op.create_table('publication',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('citation', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('doi', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_publication_user_id', 'publication', ['user_id'], unique=False)

    op.create_table('portfolio_link',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('url', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_portfolio_link_user_id', 'portfolio_link', ['user_id'], unique=False)

    op.create_table('extra_contact',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('type', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('value', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_extra_contact_user_id', 'extra_contact', ['user_id'], unique=False)

    op.create_table('user_language',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('lang', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('proficiency', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_language_user_id', 'user_language', ['user_id'], unique=False)

    op.create_table('research_interest',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('interest', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_research_interest_user_id', 'research_interest', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_research_interest_user_id', table_name='research_interest')
    op.drop_table('research_interest')
    op.drop_index('ix_user_language_user_id', table_name='user_language')
    op.drop_table('user_language')
    op.drop_index('ix_extra_contact_user_id', table_name='extra_contact')
    op.drop_table('extra_contact')
    op.drop_index('ix_portfolio_link_user_id', table_name='portfolio_link')
    op.drop_table('portfolio_link')
    op.drop_index('ix_publication_user_id', table_name='publication')
    op.drop_table('publication')
    op.drop_index('ix_project_user_id', table_name='project')
    op.drop_table('project')
    op.add_column('user', sa.Column('research_interests', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('languages', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('extra_contacts', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('portfolio_links', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('publications', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('projects', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
