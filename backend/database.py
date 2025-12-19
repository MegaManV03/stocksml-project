import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment variable
DATABASE_URL = os.environ.get("DATABASE_URL")

# Fix for Render's PostgreSQL URL format
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Fallback to SQLite only for local development
if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./test.db"

# Create engine with appropriate settings
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # For PostgreSQL (Render) - enforce SSL if not already present
    # If the URL already contains sslmode=, rely on it; otherwise pass sslmode via connect_args
    connect_args = {}
    if "sslmode=" not in DATABASE_URL:
        connect_args["sslmode"] = "require"

    engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args if connect_args else None)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()