
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from typing import Generator, Dict, Optional
import os
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import settings
from models import Base


# Fix for older postgres URLs
if settings.DATABASE_URL and settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Using database: {settings.DATABASE_URL}")

def get_postgres_connect_args(db_url: str) -> Optional[Dict[str, str]]:
    """Helper fuction to configure PostgreSQL connection arguments"""
    connect_args: Dict[str, str]= {}
    if "sslmode=" not in db_url:
        connect_args["sslmode"] = settings.POSTGRES_SSL_MODE
    return connect_args if connect_args else None


try:
    # Create engine with appropriate settings
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": settings.SQLite_CHECK_SAME_THREAD})
        print("SQLite engine created")
    else:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=settings.POSTGRES_POOL_PRE_PING, connect_args=get_postgres_connect_args(settings.DATABASE_URL))
        print("PostgreSQL engine created")

    with engine.connect() as connection:
        print("Database connected successfully")

except SQLAlchemyError as e:
    print(f"Database connection failed: {e}")
    raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        print(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()
        print("Database session closed")
