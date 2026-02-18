import os 

class Settings:
    DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("SQLALCHEMY_DATABASE_URL") or "sqlite:///.//test.db"

    #SQLite settings
    SQLite_CHECK_SAME_THREAD = False

    #PostgreSQL settings
    POSTGRES_POOL_PRE_PING = True
    POSTGRES_SSL_MODE = "require"

settings = Settings()