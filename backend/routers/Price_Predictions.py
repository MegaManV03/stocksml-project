from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Price_Predictions, User, Stock_Prices
from backend import schemas
from backend.routers.auth import get_current_admin, get_current_member
from typing import Literal, Optional


router = APIRouter()

@router.get('/')
async def list_price_predictions(
    stock_price_id: Optional[int] = None,
    model_version: Optional[str] = None,
    limit: int = 30,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Price_Predictions)
    
    if stock_price_id:
        query = query.filter(Price_Predictions.stock_price_id == stock_price_id)
    if model_version:
        query = query.filter(Price_Predictions.model_version == model_version)
    
    predictions = query.order_by(Price_Predictions.prediction_date.desc())\
        .limit(limit)\
        .all()
    
    return predictions

@router.get('/company/{company_id}')
async def get_predictions_by_company(
    company_id: int,
    db: Session = Depends(get_db),
):
    predictions = db.query(Price_Predictions)\
        .join(Stock_Prices, Price_Predictions.stock_price_id == Stock_Prices.id)\
        .filter(Stock_Prices.company_id == company_id)\
        .all()
    return predictions

