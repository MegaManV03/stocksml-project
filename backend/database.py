import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Read database URL from environment (Railway/Render provide DATABASE_URL)
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SQLALCHEMY_DATABASE_URL")

# Fallback to local SQLite for development
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./test.db"

# SQLite needs check_same_thread
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # For Postgres or other DBs
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base for models
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()