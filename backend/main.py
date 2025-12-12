from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.sectors import router as sectors_router
from routers.companies import router as companies_router  
from routers.analyses import router as analyses_router
from routers.users import router as users_router
from routers.auth import router as auth_router, get_password_hash
from models import Base, Sector, User
from database import SessionLocal, engine

def make_user_admin():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "kri").first()
        if user:
            user.role = "admin"
            db.commit()
            print(f"✅ Made {user.username} an admin!")
        else:
            admin_user = User(
                username="kri",
                email="kri@yahjo.com", 
                hashed_password=get_password_hash("kri"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("✅ Created admin user!")
    finally:
        db.close()

def create_test_data():
    db = SessionLocal()
    try:
        # Tik sektoriai, jei jų nėra
        if db.query(Sector).count() == 0:
            tech = Sector(name="Technology", description="Tech companies")
            healthcare = Sector(name="Healthcare", description="Medical companies")
            db.add_all([tech, healthcare])
            db.commit()
            print("✅ Added sectors")
        else:
            print(f"✅ Sectors exist: {db.query(Sector).count()}")
    finally:
        db.close()

# Sukurk lenteles
Base.metadata.create_all(bind=engine)

# Tik sektoriai ir admin user
create_test_data()
make_user_admin()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routeriai
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(sectors_router, prefix="/sectors", tags=["sectors"])
app.include_router(companies_router, prefix="/companies", tags=["companies"])
app.include_router(analyses_router, prefix="/analyses", tags=["analyses"])