from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from database import get_db
from models import Sector
import schemas
from models import Company, User
from routers.auth import oauth2_scheme, get_current_user, get_current_admin


router = APIRouter()

@router.get("/", response_model=list[schemas.Sector])
async def list_sectors(db: Session = Depends(get_db)):
    sectors = db.query(Sector).all()
    return sectors

@router.post("/", response_model=schemas.Sector, status_code=201)
async def create_sector(
    sector: schemas.SectorCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    db_sector = Sector(name=sector.name, description=sector.description)
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

@router.put("/{sector_id}")
async def update_sector(sector_id: int, sector_data: schemas.SectorUpdate, db: Session = Depends(get_db)):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    sector.name = sector_data.name
    sector.description = sector_data.description
    db.commit()
    return {"message": "Sector updated"}

@router.delete("/{sector_id}")
async def delete_sector(sector_id: int, db: Session = Depends(get_db)):
    sector = db.query(Sector).filter(Sector.id == sector_id).first()
    if not sector:
        raise HTTPException(status_code=404, detail="Sector not found")
    
    db.delete(sector)
    db.commit()
    return {"message": "Sector deleted"}

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
async def get_sector_company_analyses(sector_id: int, company_id: int, db: Session = Depends(get_db)):
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
    from models import Analysis  # ← ADD THIS IMPORT
    analyses = db.query(Analysis).filter(Analysis.company_id == company_id).all()
    return analyses