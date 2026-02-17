from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

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
from backend.models import Base, User
from backend.database import SessionLocal, engine
from fastapi import Request
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.responses import PlainTextResponse
from contextlib import asynccontextmanager

#creates an admin or makes existing user an admin
def make_user_admin():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "kri").first()
        if user:
            user.role = "admin"
            db.commit()
            print(f"Made {user.username} an admin!")
        else:
            admin_user = User(
                username="kri",
                email="kri@yahjo.com", 
                hashed_password=get_password_hash("kri"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("Created admin user!")
    finally:
        db.close()

# Create database tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    #making user an admin on the startup
    make_user_admin()
    yield

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
app.include_router(analyses_router, prefix="/analyses", tags=["analyses"])

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
        if full_path.startswith(("api", "auth", "sectors", "companies", "analyses")):
            raise HTTPException(status_code=404)
        return FileResponse(index_file)

    @app.exception_handler(StarletteHTTPException)
    async def spa_404_handler(request: Request, exc: StarletteHTTPException):
        # If a static file or route was not found, and the path isn't an API path,
        # return the SPA index so the frontend router can handle the route.
        path = request.url.path.lstrip("/")
        api_prefixes = ("api", "auth", "sectors", "companies", "analyses")
        if exc.status_code == 404 and index_file and not path.startswith(api_prefixes):
            return FileResponse(index_file)
        return PlainTextResponse(str(exc.detail), status_code=exc.status_code)