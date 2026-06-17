"""add blog likes and comments

Revision ID: b1c2d3e4f5a6
Revises: fab1c0ffee01
Create Date: 2026-06-17
"""
from alembic import op
import sqlalchemy as sa

revision = 'b1c2d3e4f5a6'
down_revision = 'fab1c0ffee01'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'blog_like',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('blog_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['blog_id'], ['blog.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('blog_id', 'user_id', name='uq_blog_like'),
    )
    op.create_index('ix_blog_like_blog_id', 'blog_like', ['blog_id'])
    op.create_index('ix_blog_like_user_id', 'blog_like', ['user_id'])

    op.create_table(
        'blog_comment',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('blog_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('parent_id', sa.UUID(), nullable=True),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['blog_id'], ['blog.id']),
        sa.ForeignKeyConstraint(['user_id'], ['user.id']),
        sa.ForeignKeyConstraint(['parent_id'], ['blog_comment.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_blog_comment_blog_id', 'blog_comment', ['blog_id'])
    op.create_index('ix_blog_comment_user_id', 'blog_comment', ['user_id'])
    op.create_index('ix_blog_comment_parent_id', 'blog_comment', ['parent_id'])

    op.add_column('blog', sa.Column('comments_enabled', sa.Boolean(),
                                    nullable=False, server_default='true'))


def downgrade() -> None:
    op.drop_index('ix_blog_comment_parent_id', 'blog_comment')
    op.drop_index('ix_blog_comment_user_id', 'blog_comment')
    op.drop_index('ix_blog_comment_blog_id', 'blog_comment')
    op.drop_table('blog_comment')
    op.drop_index('ix_blog_like_user_id', 'blog_like')
    op.drop_index('ix_blog_like_blog_id', 'blog_like')
    op.drop_table('blog_like')
    op.drop_column('blog', 'comments_enabled')