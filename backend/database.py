from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from config import settings
from typing import Generator



# Fix for older postgres URLs
if settings.DATABASE_URL and settings.DATABASE_URL.startswith("postgres://"):
    settings.DATABASE_URL = settings.DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Using database: {settings.DATABASE_URL}")

try:
    # Create engine with appropriate settings
    if settings.DATABASE_URL.startswith("sqlite"):
        engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": settings.SQLite_CHECK_SAME_THREAD})
        print("SQLite engine created")
    else:
        # For PostgreSQL - enforce SSL if not already present
        connect_args: dict = {}
        if "sslmode=" not in settings.DATABASE_URL:
            connect_args["sslmode"] = settings.POSTGRES_SSL_MODE

        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=settings.POSTGRES_POOL_PRE_PING, connect_args=connect_args if connect_args else None)
        print("PostgreSQL engine created")

    with engine.connect() as connection:
        print("Database connected successfully")

except SQLAlchemyError as e:
    print(f"Database connection failed: {e}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


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

#adding error handling
#Consider using config.py to store database settings separately
#Add type hints for better code clarity
#Move connect_args logic to a helper function for cleaner code

