from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .settings import settings

# Normalize PostgreSQL URL for SQLAlchemy 2.x
# Supabase and Render provide 'postgres://' or 'postgresql://'
# In SQLAlchemy 2.1+, bare 'postgresql://' defaults to psycopg 3; normalize to psycopg2 when no driver is specified
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine_kwargs = {
    "connect_args": connect_args,
}

if not db_url.startswith("sqlite"):
    # Recommendations for cloud-hosted PostgreSQL (Supabase / Render / Neon):
    # - pool_pre_ping=True checks connection health before use
    # - pool_recycle=300 recycles connections every 5 min to avoid server-side timeouts
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """FastAPI dependency for yielding database session with automatic cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
