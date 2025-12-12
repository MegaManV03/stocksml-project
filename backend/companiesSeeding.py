import sys
import os
import asyncio
from sqlalchemy.orm import Session
from sqlalchemy import create_engine, delete
from sqlalchemy.exc import IntegrityError

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import your database models and fetcher
from database import Base, get_db
from models import Sector, Company
from stockData.fetcher import fetcher

# Configuration
DATABASE_URL = "sqlite:///./test.db"  # Update with your actual DB URL
engine = create_engine(DATABASE_URL)
Base.metadata.bind = engine

# Sector mapping: sector_id -> list of stock symbols
SECTOR_STOCKS = {
    1: ["AAPL", "MSFT", "GOOGL", "NVDA", "INTC", "AMD", "ADBE", "CRM", "CSCO", "ORCL"],  # Technology
    2: ["JNJ", "PFE", "UNH", "ABT", "TMO", "MRK", "ABBV", "LLY", "DHR", "BMY"],  # Healthcare
    3: ["JPM", "BAC", "WFC", "C", "GS", "MS", "BLK", "AXP", "SPGI", "MMC"],  # Financials
    4: ["AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TGT", "BKNG", "MAR"],  # Consumer Discretionary
    5: ["PG", "KO", "PEP", "WMT", "COST", "PM", "MDLZ", "CL", "MO", "KMB"],  # Consumer Staples
    6: ["UPS", "RTX", "HON", "CAT", "BA", "GE", "MMM", "DE", "LMT", "UNP"],  # Industrials
    7: ["XOM", "CVX", "COP", "SLB", "EOG", "PSX", "MPC", "VLO", "OKE", "WMB"],  # Energy
    8: ["NEE", "DUK", "SO", "D", "AEP", "EXC", "SRE", "XEL", "WEC", "ED"],  # Utilities
    9: ["PLD", "AMT", "CCI", "EQIX", "PSA", "SPG", "O", "AVB", "EQR", "DLR"],  # Real Estate
    10: ["LIN", "APD", "SHW", "ECL", "NEM", "FCX", "DD", "NUE", "STLD", "MLM"],  # Materials
    11: ["GOOG", "META", "NFLX", "DIS", "CMCSA", "T", "VZ", "CHTR", "TMUS", "EA"]  # Communication Services
}

def clear_all_companies():
    """Delete ALL existing company records"""
    session = Session(bind=engine)
    try:
        # Count before deletion
        count_before = session.query(Company).count()
        
        # Delete all companies
        deleted_count = session.query(Company).delete()
        session.commit()
        
        print(f"🗑️  Deleted {deleted_count} existing companies (was {count_before})")
        return deleted_count
    except Exception as e:
        session.rollback()
        print(f"❌ Error clearing companies: {str(e)}")
        return 0
    finally:
        session.close()

async def fetch_all_stock_data():
    """Fetch data for all stocks across sectors"""
    all_symbols = []
    symbol_to_sector = {}
    
    # Prepare symbol mapping
    for sector_id, symbols in SECTOR_STOCKS.items():
        for symbol in symbols:
            all_symbols.append(symbol)
            symbol_to_sector[symbol] = sector_id
    
    print(f"📥 Fetching data for {len(all_symbols)} stocks...")
    
    # Fetch all stock data
    stock_data = await fetcher.fetch_batch(all_symbols)
    
    # Add sector_id to each result
    for data in stock_data:
        symbol = data['symbol']
        data['sector_id'] = symbol_to_sector.get(symbol, 0)
    
    return stock_data

def seed_database(stock_data):
    """Insert stock data into database"""
    session = Session(bind=engine)
    
    inserted = 0
    errors = 0
    
    for stock in stock_data:
        # Skip if missing essential data
        if not stock.get('company_name') or stock['company_name'] == 'N/A':
            print(f"⚠️  Skipping {stock['symbol']}: Missing company name")
            errors += 1
            continue
        
        # Create new company record with GUARANTEED sector_id
        company = Company(
            sector_id=stock['sector_id'],  # This is now guaranteed from mapping
            symbol=stock['symbol'],
            company_name=stock['company_name'],
            market_cap=stock['market_cap'] or 0,
            pe_ratio=stock['pe_ratio'] or 0,
            revenue=stock['revenue'] or 0
        )
        
        try:
            session.add(company)
            inserted += 1
            
            # Show progress every 10 companies
            if inserted % 10 == 0:
                print(f"  ... {inserted} companies added")
                
        except Exception as e:
            errors += 1
            print(f"❌ Error adding {stock['symbol']}: {str(e)}")
    
    try:
        session.commit()
        print(f"✅ Committed {inserted} companies to database")
    except Exception as e:
        session.rollback()
        print(f"❌ Commit failed: {str(e)}")
        inserted = 0
    
    session.close()
    return inserted, errors

def verify_sectors():
    """Check if all sectors exist in database"""
    session = Session(bind=engine)
    sectors = session.query(Sector).all()
    session.close()
    
    if not sectors:
        print("❌ CRITICAL: No sectors found in database!")
        print("   You must create sectors first using your FastAPI:")
        print("   POST /sectors/ with {'name': 'Technology', 'description': '...'}")
        return False
    
    print(f"\n✅ Found {len(sectors)} sectors in database:")
    for sector in sectors:
        print(f"   Sector {sector.id}: {sector.name}")
    
    # Verify all sector IDs in our mapping exist
    missing_sectors = set(SECTOR_STOCKS.keys()) - {s.id for s in sectors}
    if missing_sectors:
        print(f"\n⚠️  Warning: These sector IDs don't exist in DB: {missing_sectors}")
        print("   Some companies may not be inserted.")
    
    return True

def verify_seed():
    """Verify the seed was successful"""
    session = Session(bind=engine)
    
    # Count companies
    total_companies = session.query(Company).count()
    
    # Count companies with NULL sector_id
    null_sector_companies = session.query(Company).filter(Company.sector_id == None).count()
    
    # Count by sector
    from sqlalchemy import func
    sector_counts = session.query(
        Company.sector_id, 
        func.count(Company.id).label('count')
    ).group_by(Company.sector_id).all()
    
    session.close()
    
    print(f"\n📊 VERIFICATION:")
    print(f"   Total companies: {total_companies}")
    print(f"   Companies with NULL sector_id: {null_sector_companies}")
    
    if null_sector_companies > 0:
        print("   ❌ PROBLEM: Some companies have NULL sector_id!")
    
    print(f"\n   Companies by sector:")
    for sector_id, count in sector_counts:
        print(f"      Sector {sector_id}: {count} companies")
    
    return null_sector_companies == 0

async def main():
    print("=" * 70)
    print("STOCK DATA SEEDING SCRIPT - CLEAN & RELOAD")
    print("=" * 70)
    
    # Step 1: Verify sectors exist
    if not verify_sectors():
        print("\n❌ Cannot proceed without sectors. Create them first.")
        return
    
    # Step 2: Clear ALL existing companies
    print("\n" + "-" * 70)
    print("STEP 1: CLEARING EXISTING DATA")
    print("-" * 70)
    deleted = clear_all_companies()
    
    # Step 3: Fetch fresh stock data
    print("\n" + "-" * 70)
    print("STEP 2: FETCHING FRESH STOCK DATA")
    print("-" * 70)
    stock_data = await fetch_all_stock_data()
    print(f"✅ Received {len(stock_data)} stock records")
    
    # Step 4: Seed database with fresh data
    print("\n" + "-" * 70)
    print("STEP 3: SEEDING DATABASE")
    print("-" * 70)
    inserted, errors = seed_database(stock_data)
    
    # Step 5: Verify the seed
    print("\n" + "-" * 70)
    print("STEP 4: VERIFICATION")
    print("-" * 70)
    verification_ok = verify_seed()
    
    print("\n" + "=" * 70)
    print("SEEDING COMPLETE - SUMMARY")
    print("=" * 70)
    print(f"🗑️  Deleted: {deleted} old companies")
    print(f"📥 Fetched: {len(stock_data)} stock records")
    print(f"✅ Inserted: {inserted} new companies")
    print(f"⚠️  Errors: {errors} failed inserts")
    
    if verification_ok:
        print("\n🎉 SUCCESS: All companies have valid sector IDs!")
        print("   Your FastAPI /companies/ endpoint should now work.")
    else:
        print("\n❌ WARNING: Some companies have NULL sector_id")
        print("   The /companies/ endpoint may still fail.")
    
    print("\n💡 Next steps:")
    print("   1. Restart your FastAPI server")
    print("   2. Test: curl http://localhost:8000/companies/")
    print("   3. Test: curl http://localhost:8000/sectors/1/companies")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())