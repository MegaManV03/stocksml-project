from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Analysis, User
from backend import schemas
from backend.routers.auth import get_current_admin
