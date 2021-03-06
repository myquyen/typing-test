"""empty message

Revision ID: cbf576d381e5
Revises: 
Create Date: 2019-09-17 15:25:56.542670

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'cbf576d381e5'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('score', sa.Column('errors', sa.Integer(), nullable=True))
    op.add_column('score', sa.Column('time', sa.Integer(), nullable=True))
    op.add_column('score', sa.Column('wpm', sa.Integer(), nullable=False))
    op.drop_column('score', 'score')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('score', sa.Column('score', sa.INTEGER(), autoincrement=False, nullable=False))
    op.drop_column('score', 'wpm')
    op.drop_column('score', 'time')
    op.drop_column('score', 'errors')
    # ### end Alembic commands ###
