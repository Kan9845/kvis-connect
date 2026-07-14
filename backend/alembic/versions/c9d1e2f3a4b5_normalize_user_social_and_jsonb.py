"""normalize user: social_link table + jsonb blobs

Extracts the 5 social URL columns (+ their 5 public flags) into a social_link
table, and retypes competitions/experience_camps/clubs from text to JSONB.
Also a merge point for the three prior heads.

Revision ID: c9d1e2f3a4b5
Revises: b2c3d4e5f6a8, backfill_hk_coords, add_research_public_flags
Create Date: 2026-07-13

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

revision = 'c9d1e2f3a4b5'
down_revision = ('backfill_hk_coords', 'add_research_public_flags')
branch_labels = None
depends_on = None

# platform -> (url column, public-flag column)
SOCIALS = [
    ('facebook', 'facebook_url', 'facebook_public'),
    ('linkedin', 'linkedin_url', 'linkedin_public'),
    ('instagram', 'instagram_url', 'instagram_public'),
    ('website', 'website_url', 'website_public'),
    ('line', 'line_id', 'line_id_public'),
]
URL_COLS = ['facebook_url', 'linkedin_url', 'instagram_url', 'website_url', 'line_id']
FLAG_COLS = ['facebook_public', 'linkedin_public', 'instagram_public', 'website_public', 'line_id_public']
JSONB_COLS = ['competitions', 'experience_camps', 'clubs']


def upgrade() -> None:
    # 1. social_link table
    op.create_table(
        'social_link',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('user.id'), nullable=False),
        sa.Column('platform', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('value', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('is_public', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_social_link_user_id', 'social_link', ['user_id'])

    # 2. backfill rows: one per platform where a url exists or the flag is non-default
    for platform, url_col, flag_col in SOCIALS:
        op.execute(f"""
            INSERT INTO social_link (id, user_id, platform, value, is_public, order_index)
            SELECT gen_random_uuid(), id, '{platform}', COALESCE({url_col}, ''),
                   COALESCE({flag_col}, true), 0
            FROM "user"
            WHERE ({url_col} IS NOT NULL AND {url_col} <> '') OR {flag_col} = false
        """)

    # 3. drop the old columns
    for c in URL_COLS + FLAG_COLS:
        op.drop_column('user', c)

    # 4. text -> jsonb (NULLIF guards the empty-string rows that aren't valid JSON)
    for c in JSONB_COLS:
        op.execute(f'ALTER TABLE "user" ALTER COLUMN {c} TYPE jsonb USING NULLIF({c}, \'\')::jsonb')


def downgrade() -> None:
    # jsonb -> text
    for c in JSONB_COLS:
        op.execute(f'ALTER TABLE "user" ALTER COLUMN {c} TYPE varchar USING {c}::text')

    # re-add social columns
    for c in URL_COLS:
        op.add_column('user', sa.Column(c, sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    for c in FLAG_COLS:
        op.add_column('user', sa.Column(c, sa.Boolean(), nullable=False, server_default='true'))

    # copy values back from social_link
    for platform, url_col, flag_col in SOCIALS:
        op.execute(f"""
            UPDATE "user" u
            SET {url_col} = NULLIF(s.value, ''), {flag_col} = s.is_public
            FROM social_link s
            WHERE s.user_id = u.id AND s.platform = '{platform}'
        """)

    op.drop_index('ix_social_link_user_id', table_name='social_link')
    op.drop_table('social_link')
