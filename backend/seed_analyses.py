import sys
import os
import asyncio
import random
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import create_engine

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base
from models import Company, Analysis

# Configuration
DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL)
Base.metadata.bind = engine

def generate_analysis_data(company_id, base_price=100, days_back=10):
    """Generate analysis data for a company"""
    analyses = []
    today = datetime.now()
    
    for i in range(days_back):
        date = today - timedelta(days=days_back - i - 1)
        
        # Ensure base_price is float
        base = float(base_price) if hasattr(base_price, '__float__') else float(base_price)
        
        # Generate prices
        open_price = Decimal(str(round(base * random.uniform(0.98, 1.02), 2)))
        close_price = Decimal(str(round(base * random.uniform(0.97, 1.03), 2)))
        high_price = Decimal(str(round(max(float(open_price), float(close_price)) * random.uniform(1.01, 1.05), 2)))
        low_price = Decimal(str(round(min(float(open_price), float(close_price)) * random.uniform(0.95, 0.99), 2)))
        
        # Volume
        volume = random.randint(1000000, 10000000)
        
        # Predictions
        predicted_close = Decimal(str(round(float(close_price) * random.uniform(0.97, 1.03), 2)))
        
        # Signal
        rand = random.random()
        if rand < 0.4:
            signal = "BUY"
            confidence = random.randint(70, 95)
        elif rand < 0.7:
            signal = "HOLD"
            confidence = random.randint(50, 80)
        else:
            signal = "SELL"
            confidence = random.randint(60, 85)
        
        analysis = Analysis(
            company_id=company_id,
            date=date.replace(hour=9, minute=30, second=0),
            open_price=open_price,
            close_price=close_price,
            high_price=high_price,
            low_price=low_price,
            volume=volume,
            predicted_high=Decimal(str(round(float(high_price) * random.uniform(0.98, 1.02), 2))),
            predicted_low=Decimal(str(round(float(low_price) * random.uniform(0.98, 1.02), 2))),
            predicted_open=Decimal(str(round(float(open_price) * random.uniform(0.98, 1.02), 2))),
            predicted_close=predicted_close,
            signal=signal,
            confidence_score=confidence
        )
        
        analyses.append(analysis)
    
    return analyses

def seed_analyses():
    """Seed analysis data"""
    session = Session(bind=engine)
    inserted = 0
    
    try:
        companies = session.query(Company).all()
        print(f"Found {len(companies)} companies")
        
        for company in companies:
            # Skip if has analyses
            if session.query(Analysis).filter_by(company_id=company.id).count() > 0:
                continue
            
            # Get a realistic base price
            if company.pe_ratio and company.pe_ratio > 0:
                base_price = float(company.pe_ratio) * 10
            elif company.market_cap and company.market_cap > 0:
                base_price = float(company.market_cap) / 1000000000  # Simplified
            else:
                base_price = 100.0
            
            analyses = generate_analysis_data(company.id, base_price, 7)  # 7 days
            
            for analysis in analyses:
                session.add(analysis)
            
            inserted += len(analyses)
            print(f"✅ {company.symbol}: {len(analyses)} analyses")
        
        session.commit()
        print(f"\n🎉 Added {inserted} total analyses")
        
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        session.close()

def quick_seed():
    """Quick seed for testing"""
    session = Session(bind=engine)
    
    # Get first 3 companies
    companies = session.query(Company).limit(3).all()
    
    for company in companies:
        print(f"Seeding {company.symbol}...")
        
        # Add 5 simple analyses
        for day in range(5):
            date = datetime.now() - timedelta(days=4 - day)
            
            # Simple price around $100
            open_price = Decimal(str(round(100 * random.uniform(0.95, 1.05), 2)))
            close_price = Decimal(str(round(100 * random.uniform(0.96, 1.04), 2)))
            
            analysis = Analysis(
                company_id=company.id,
                date=date.replace(hour=9, minute=30),
                open_price=open_price,
                close_price=close_price,
                high_price=Decimal(str(round(float(close_price) * 1.03, 2))),
                low_price=Decimal(str(round(float(open_price) * 0.97, 2))),
                volume=random.randint(500000, 5000000),
                predicted_high=Decimal(str(round(float(close_price) * 1.02, 2))),
                predicted_low=Decimal(str(round(float(open_price) * 0.98, 2))),
                predicted_open=Decimal(str(round(100 * random.uniform(0.96, 1.04), 2))),
                predicted_close=Decimal(str(round(float(close_price) * 1.01, 2))),
                signal=random.choice(["BUY", "HOLD"]),  # Only BUY/HOLD as requested
                confidence_score=random.randint(70, 85)
            )
            session.add(analysis)
    
    session.commit()
    session.close()
    print("✅ Added analyses for 3 companies")

def clear_analyses():
    """Clear all analyses"""
    session = Session(bind=engine)
    try:
        deleted = session.query(Analysis).delete()
        session.commit()
        print(f"🗑️  Deleted {deleted} analyses")
    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    print("=" * 60)
    print("ANALYSIS DATA SEEDING (FIXED)")
    print("=" * 60)
    
    print("\n1. Clear all and seed fresh")
    print("2. Quick seed (3 companies, BUY/HOLD only)")
    print("3. Clear all analyses")
    
    choice = input("\nChoice (1-3): ").strip()
    
    if choice == "1":
        clear_analyses()
        seed_analyses()
    elif choice == "2":
        quick_seed()
    elif choice == "3":
        clear_analyses()
    else:
        print("❌ Invalid")