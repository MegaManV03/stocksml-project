from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Stock_Prices, User
from backend import schemas
from backend.routers.auth import get_current_admin, get_current_user

router = APIRouter()

