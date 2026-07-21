from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# ----------------------------------------
# SQLAlchemy Engine
# ----------------------------------------

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
)

# ----------------------------------------
# Session Factory
# ----------------------------------------

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)

# ----------------------------------------
# Base Model
# ----------------------------------------


class Base(DeclarativeBase):
    pass


# ----------------------------------------
# Dependency
# ----------------------------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()