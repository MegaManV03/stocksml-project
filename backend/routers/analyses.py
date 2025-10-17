from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Analysis
import schemas

router = APIRouter()

@router.get("/", response_model=list[schemas.Analysis])
async def list_analyses(db: Session = Depends(get_db)):
    analyses = db.query(Analysis).all()
    return analyses

@router.post("/", response_model=schemas.Analysis, status_code=201)
async def create_analysis(analysis: schemas.AnalysisCreate, db: Session = Depends(get_db)):
    db_analysis = Analysis(
        company_id=analysis.company_id,
        date=analysis.date,
        open_price=analysis.open_price,
        close_price=analysis.close_price,
        high_price=analysis.high_price,
        low_price=analysis.low_price,
        volume=analysis.volume,
        predicted_high=analysis.predicted_high,
        predicted_low=analysis.predicted_low,
        predicted_open=analysis.predicted_open,  # ← ADD THIS
        predicted_close=analysis.predicted_close,
        signal=analysis.signal,
        confidence_score=analysis.confidence_score
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    return db_analysis

@router.get("/{analysis_id}", response_model=schemas.Analysis)
async def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis

@router.put("/{analysis_id}")
async def update_analysis(analysis_id: int, analysis_data: schemas.AnalysisUpdate, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    analysis.close_price = analysis_data.close_price
    analysis.predicted_close = analysis_data.predicted_close
    analysis.signal = analysis_data.signal
    analysis.confidence_score = analysis_data.confidence_score
    
    db.commit()
    return {"message": "Analysis updated"}

@router.delete("/{analysis_id}", status_code=204)
async def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    db.delete(analysis)
    db.commit()
