from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Sector
from backend import schemas
from backend.models import Company, User, Analysis
from backend.routers.auth import oauth2_scheme, get_current_member, get_current_admin


router = APIRouter()

@router.get("/", response_model=list[schemas.Sector])
async def list_sectors(db: Session = Depends(get_db)):
    sectors = db.query(Sector).all()
    return sectors

@router.post("/sectors", response_model=schemas.Sector, status_code=201)
async def create_sector(
    sector_data: schemas.SectorCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    db_sector = Sector(**sector_data.dict())
    db.add(db_sector)
    db.commit()
    db.refresh(db_sector)
    return db_sector

@router.get("/{sector_id}", response_model=schemas.Sector)
async def get_sector(sector_id: int, db: Session = Depends(get_db)):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    return sector

@router.put("/sectors/{sector_id}", response_model=schemas.Sector)
async def update_sector(
    sector_id: int,
    sector_data: schemas.SectorUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    for key, value in sector_data.dict(exclude_unset=True).items():
        setattr(sector, key, value)
    
    db.commit()
    db.refresh(sector)
    return sector

@router.delete("/sectors/{sector_id}")
async def delete_sector(
    sector_id: int,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    db.delete(sector)
    db.commit()
    return {"message": "Sector deleted successfully"}

@router.get("/{sector_id}/companies", response_model=list[schemas.Company])
async def get_sector_companies(sector_id: int, db: Session = Depends(get_db)):
    # First check if sector exists
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    # Get companies in this sector
    companies = db.query(Company).filter(Company.sector_id == sector_id).all()
    return companies

@router.get("/{sector_id}/companies/{company_id}", response_model=schemas.Company)
async def get_sector_company(sector_id: int, company_id: int, db: Session = Depends(get_db)):
    # Verify sector exists
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    # Verify company exists AND belongs to this sector
    company = db.query(Company).filter(
        Company.id == company_id, 
        Company.sector_id == sector_id
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found in this sector")
    
    return company

@router.get("/{sector_id}/companies/{company_id}/analyses", response_model=list[schemas.Analysis])
async def get_sector_company_analyses(
    sector_id: int, 
    company_id: int, 
    current_user: User = Depends(get_current_member),  # ← PRIDĖTA
    db: Session = Depends(get_db)
):
    # Verify sector exists
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    # Verify company exists AND belongs to this sector
    company = db.query(Company).filter(
        Company.id == company_id, 
        Company.sector_id == sector_id
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found in this sector")
    
    # Get all analyses for this company
    analyses = db.query(Analysis).filter(Analysis.company_id == company_id).all()
    return analyses