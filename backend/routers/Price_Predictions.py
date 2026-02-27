from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Price_Predictions, User
from backend import schemas
from backend.routers.auth import get_current_admin
from typing import Literal


router = APIRouter()

@router.get('/')
async def list_price_predictions(
    timestamp: Literal['5min', '15min', '30min', '1h', '5h', '1d', '1w', '1m'],
    limit: int = 30,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    predictions = db.query(Price_Predictions)\
        .filter(Price_Predictions.timestamp == timestamp)\
        .order_by(Price_Predictions.date.desc())\
        .limit(limit)\
        .all()
    return predictions




