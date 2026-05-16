"""initial

Revision ID: 8afc1cc494a5
Revises:
Create Date: 2026-05-12 01:32:24.050424

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


revision = '8afc1cc494a5'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sqlmodel.AutoString(), nullable=False),
        sa.Column('hashed_password', sqlmodel.AutoString(), nullable=True),
        sa.Column('google_id', sqlmodel.AutoString(), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('kvis_email', sqlmodel.AutoString(), nullable=True),
        sa.Column('first_name', sqlmodel.AutoString(), nullable=False),
        sa.Column('last_name', sqlmodel.AutoString(), nullable=False),
        sa.Column('kvis_year', sa.Integer(), nullable=True),
        sa.Column('facebook_url', sqlmodel.AutoString(), nullable=True),
        sa.Column('linkedin_url', sqlmodel.AutoString(), nullable=True),
        sa.Column('line_id', sqlmodel.AutoString(), nullable=True),
        sa.Column('website_url', sqlmodel.AutoString(), nullable=True),
        sa.Column('place', sqlmodel.AutoString(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('country', sqlmodel.AutoString(), nullable=True),
        sa.Column('profile_pic_url', sqlmodel.AutoString(), nullable=True),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('mbti', sqlmodel.AutoString(), nullable=True),
        sa.Column('interests', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_email', 'user', ['email'], unique=True)
    op.create_index('ix_user_google_id', 'user', ['google_id'], unique=False)
    op.create_index('ix_user_kvis_year', 'user', ['kvis_year'], unique=False)
    op.create_index('ix_user_country', 'user', ['country'], unique=False)

    op.create_table(
        'education',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('uni_name', sqlmodel.AutoString(), nullable=False),
        sa.Column('degree', sqlmodel.AutoString(), nullable=False),
        sa.Column('major', sqlmodel.AutoString(), nullable=False),
        sa.Column('country', sqlmodel.AutoString(), nullable=False),
        sa.Column('state', sqlmodel.AutoString(), nullable=True),
        sa.Column('scholarship', sqlmodel.AutoString(), nullable=True),
        sa.Column('start_year', sa.Integer(), nullable=True),
        sa.Column('end_year', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_education_user_id', 'education', ['user_id'], unique=False)

    op.create_table(
        'career',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('job_title', sqlmodel.AutoString(), nullable=False),
        sa.Column('employer', sqlmodel.AutoString(), nullable=False),
        sa.Column('job_field', sqlmodel.AutoString(), nullable=False),
        sa.Column('country', sqlmodel.AutoString(), nullable=False),
        sa.Column('state', sqlmodel.AutoString(), nullable=True),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('start_year', sa.Integer(), nullable=True),
        sa.Column('end_year', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_career_user_id', 'career', ['user_id'], unique=False)

    op.create_table(
        'blog',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('author_id', sa.Integer(), nullable=False),
        sa.Column('title', sqlmodel.AutoString(), nullable=False),
        sa.Column('slug', sqlmodel.AutoString(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('excerpt', sa.Text(), nullable=True),
        sa.Column('cover_image_url', sqlmodel.AutoString(), nullable=True),
        sa.Column('tags', sqlmodel.AutoString(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('published_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['author_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_blog_author_id', 'blog', ['author_id'], unique=False)
    op.create_index('ix_blog_slug', 'blog', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_blog_slug', table_name='blog')
    op.drop_index('ix_blog_author_id', table_name='blog')
    op.drop_table('blog')

    op.drop_index('ix_career_user_id', table_name='career')
    op.drop_table('career')

    op.drop_index('ix_education_user_id', table_name='education')
    op.drop_table('education')

    op.drop_index('ix_user_country', table_name='user')
    op.drop_index('ix_user_kvis_year', table_name='user')
    op.drop_index('ix_user_google_id', table_name='user')
    op.drop_index('ix_user_email', table_name='user')
    op.drop_table('user')
