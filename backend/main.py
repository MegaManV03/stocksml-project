from fastapi import FastAPI
from routers.sectors import router as sectors_router
from routers.companies import router as companies_router  
from routers.analyses import router as analyses_router
from routers.users import router as users_router
from routers.auth import router as auth_router, get_password_hash
from models import Base, Company, Sector, User
from database import SessionLocal
from database import engine



def make_user_admin():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "kri").first()
        if user:
            user.role = "admin"
            db.commit()
            print(f"✅ Made {user.username} an admin!")
        else:
            # Create admin user if doesn't exist
            admin_user = User(
                username="kri",
                email="kri@yahjo.com", 
                hashed_password=get_password_hash("kri"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("✅ Created Kristupas as admin!")
    finally:
        db.close()




def create_test_data():
    db = SessionLocal()
    
    # Add sectors
    tech = Sector(name="Technology", description="Tech companies")
    healthcare = Sector(name="Healthcare", description="Medical companies")
    db.add_all([tech, healthcare])
    db.commit()
    
    print("✅ Test data added!")


Base.metadata.create_all(bind=engine)
create_test_data()
make_user_admin()  

app = FastAPI()

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/v1", tags=["users"])
app.include_router(sectors_router, prefix="/sectors", tags=["sectors"])
app.include_router(companies_router, prefix="/companies", tags=["companies"])
app.include_router(analyses_router, prefix="/analyses", tags=["analyses"])