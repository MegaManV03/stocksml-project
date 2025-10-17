from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Company
import schemas

router = APIRouter()

@router.get("/", response_model=list[schemas.Company])
async def list_companies(db: Session = Depends(get_db)):
    companies = db.query(Company).all()
    return companies

@router.post("/", response_model=schemas.Company, status_code=201)
async def create_company(company: schemas.CompanyCreate, db: Session = Depends(get_db)):
    db_company = Company(
        sector_id=company.sector_id,
        symbol=company.symbol,
        company_name=company.company_name,
        market_cap=company.market_cap,
        pe_ratio=company.pe_ratio,
        revenue=company.revenue
    )
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company

@router.get("/{company_id}", response_model=schemas.Company)
async def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.put("/{company_id}")
async def update_company(company_id: int, company_data: schemas.CompanyUpdate, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Update fields
    company.symbol = company_data.symbol
    company.company_name = company_data.company_name
    company.market_cap = company_data.market_cap
    # ... update other fields
    
    db.commit()
    return {"message": "Company updated"}

@router.delete("/{company_id}")
async def delete_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(company)
    db.commit()
    return {"message": "Company deleted"}