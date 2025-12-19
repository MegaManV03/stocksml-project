"""Small DB connection tester.
Reads DATABASE_URL from env, normalizes postgres:// -> postgresql://,
connects and prints a redacted host, Postgres version and table list.

Run locally after setting DATABASE_URL in your environment or creating stocksml.env.
"""
import os
from sqlalchemy import create_engine, text, inspect


def redact_url(url: str) -> str:
    # Return only host/db part, hide credentials
    try:
        if "@" in url:
            return url.split("@", 1)[1]
        return url
    except Exception:
        return "<redacted>"


def main():
    url = os.environ.get("DATABASE_URL")
    if not url:
        print("No DATABASE_URL found in environment. Set it or create stocksml.env and restart the app.")
        return

    # Normalize
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    print("Attempting connection to:", redact_url(url))

    # Ensure sslmode if using remote Postgres
    connect_args = {}
    if url.startswith("postgresql://") and "sslmode=" not in url:
        # Many providers require ssl; if your URL already contains params, leave them.
        # For SQLAlchemy, pass sslmode via connect_args when using psycopg2.
        connect_args["sslmode"] = "require"

    try:
        engine = create_engine(url, pool_pre_ping=True, connect_args=connect_args or None)
        with engine.connect() as conn:
            v = conn.execute(text("SELECT version();")).fetchone()
            print("Postgres version:", v[0])

            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print("Tables:", tables)
    except Exception as exc:
        print("Connection failed:", exc)


if __name__ == "__main__":
    main()
