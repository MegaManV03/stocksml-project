from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Company, User,Stock_Prices
from backend import schemas
from backend.routers.auth import get_current_admin, get_current_member  # Add this import

router = APIRouter()

# GET all companies - ADMIN ONLY
@router.get("/", response_model=list[schemas.Company])
async def list_companies(
    current_user: User = Depends(get_current_admin),  # Admin only
    db: Session = Depends(get_db)
):
    companies = db.query(Company).all()
    return companies

# POST create company - ADMIN ONLY
@router.post("/", response_model=schemas.Company, status_code=201)
async def create_company(
    company: schemas.CompanyCreate,
    current_user: User = Depends(get_current_admin),  # Admin only
    db: Session = Depends(get_db)
):
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

# GET single company - ADMIN AND MEMBER
@router.get("/{company_id}", response_model=schemas.Company)
async def get_company(
    company_id: int,
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

# PUT update company - ADMIN ONLY
@router.put("/{company_id}")
async def update_company(
    company_id: int,
    company_data: schemas.CompanyUpdate,
    current_user: User = Depends(get_current_admin),  # Admin only
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Update fields
    company.symbol = company_data.symbol
    company.company_name = company_data.company_name
    company.market_cap = company_data.market_cap
    company.pe_ratio = company_data.pe_ratio
    company.revenue = company_data.revenue
    if company_data.sector_id:
        company.sector_id = company_data.sector_id
    
    db.commit()
    return {"message": "Company updated"}

# DELETE company - ADMIN ONLY
@router.delete("/{company_id}")
async def delete_company(
    company_id: int,
    current_user: User = Depends(get_current_admin),  # Admin only
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db.delete(company)
    db.commit()
    return {"message": "Company deleted"}

@router.get('/{company_id}/stock-prices')
async def get_company_stock_prices(
    company_id: int,
    timeframe: str = '15m',
    db: Session = Depends(get_db),
):
    stock_prices = db.query(Stock_Prices)\
        .filter(Stock_Prices.company_id == company_id)\
        .filter(Stock_Prices.timestamp == timeframe).order_by(Stock_Prices.date.desc())\
        .all()
    
    return stock_prices