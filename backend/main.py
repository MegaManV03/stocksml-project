from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
import os
from apscheduler.schedulers.background import BackgroundScheduler
from backend.ml_pipeline.scheduler_jobs import run_pipeline 


# Optionally load `stocksml.env` in development if python-dotenv is installed.
# We avoid hard-failing when dotenv is not available so you can run without it.
try:
    from dotenv import load_dotenv  # type: ignore
except Exception:
    load_dotenv = None

# Load local env file `stocksml.env` (only if present and load_dotenv is available).
ROOT = Path(__file__).resolve().parent.parent
env_path = ROOT / "stocksml.env"
if env_path.exists() and load_dotenv:
    load_dotenv(env_path)


from backend.routers.sectors import router as sectors_router
from backend.routers.companies import router as companies_router
from backend.routers.analyses import router as analyses_router
from backend.routers.users import router as users_router
from backend.routers.auth import router as auth_router, get_password_hash
from backend.routers.price_predictions import router as predictions_router
from backend.routers.stock_prices import router as price_router
from backend.models import Base, User
from backend.database import SessionLocal, engine
from fastapi import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import PlainTextResponse
from contextlib import asynccontextmanager
from sqlalchemy import text







try:
    # Create database tables    
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(F" Database creation Failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = BackgroundScheduler()
    # Start scheduler
    scheduler.add_job(run_pipeline, 'cron', minute='*/5', args=['5m'])  # Every 5 minutes
    scheduler.add_job(run_pipeline, 'cron', minute='*/15', args=['15m'])
    scheduler.add_job(run_pipeline, 'cron', minute='*/30', args=['30m'])  # Every 30 minutes
    scheduler.add_job(run_pipeline, 'cron', hour='*', args=['1h'])  # Every hour at minute 0
    scheduler.start()
    
    yield
    
    # Shutdown scheduler on app stop
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)


# CORS - Update origins for production deployment
origins = [
    "http://localhost:5173",
    "https://stocksml.onrender.com", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(sectors_router, prefix="/sectors", tags=["sectors"])
app.include_router(companies_router, prefix="/companies", tags=["companies"])
app.include_router(predictions_router, prefix="/predictions", tags=["predictions"])


# Serve frontend static files
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"
FRONTEND_PUBLIC = BASE_DIR / "frontend" / "public"

index_file = None
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
    index_file = FRONTEND_DIST / "index.html"
elif FRONTEND_PUBLIC.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_PUBLIC), html=True), name="frontend")
    index_file = FRONTEND_PUBLIC / "index.html"

if index_file and index_file.exists():
    @app.get("/{full_path:path}")
    async def spa_catch_all(full_path: str):
        # Prevent catching API routes
        if full_path.startswith(("api", "auth", "sectors", "companies", "predictions")):
            raise HTTPException(status_code=404)
        return FileResponse(index_file)

    @app.exception_handler(StarletteHTTPException)
    async def spa_404_handler(request: Request, exc: StarletteHTTPException):
        # If a static file or route was not found, and the path isn't an API path,
        # return the SPA index so the frontend router can handle the route.
        path = request.url.path.lstrip("/")
        api_prefixes = ("api", "auth", "sectors", "companies", "predictions")
        if exc.status_code == 404 and index_file and not path.startswith(api_prefixes):
            return FileResponse(index_file)
        return PlainTextResponse(str(exc.detail), status_code=exc.status_code)
    

