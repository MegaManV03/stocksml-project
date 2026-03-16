import yfinance as yf
from yfinance.exceptions import YFPricesMissingError
import pandas as pd
import datetime

from ..database import SessionLocal
import time
from ..models import Stock_Prices, Company, Sector
from sqlalchemy import func


#create session
db_session = SessionLocal()




interval_max_days = {
    '1m': 7,
    '5m': 60,
    '15m': 60,
    '30m': 60,
    '1h': 730,
    '4h': 730,
    '1d': 1825,  # 5 years
}


def download_stock_data(interval, sector_tickers_dict):
    """
    Download stock data for specified interval using sector-tickers mapping
    
    Args:
        interval: str - interval string like '1m', '5m', '1h', '1d'
        sector_tickers_dict: dict - mapping sector names to lists of tickers
    """

    # Reverse mapping for ticker to sector
    ticker_to_sector = {}
    for sector_name, tickers_list in sector_tickers_dict.items():
        for ticker in tickers_list:
            ticker_to_sector[ticker] = sector_name
    
    # Flat list of tickers
    tickers = list(ticker_to_sector.keys())
    
    # Ensure sectors exist
    for sector_name in sector_tickers_dict.keys():
        sector = db_session.query(Sector).filter(Sector.name == sector_name).first()
        if not sector:
            sector = Sector(name=sector_name)
            db_session.add(sector)
            db_session.commit()
            db_session.refresh(sector)
    
    for ticker in tickers:
        # Get or create company with sector
        sector_name = ticker_to_sector[ticker]
        sector = db_session.query(Sector).filter(Sector.name == sector_name).first()
        
        company = db_session.query(Company).filter(Company.symbol == ticker).first()
        if not company:
            company = Company(
                symbol=ticker,
                company_name=ticker,
                sector_id=sector.id
            )
            db_session.add(company)
            db_session.commit()
            db_session.refresh(company)
        
        company_id = company.id
        

        
        endDate = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)
        
        # Check if company has data for this interval
        existing_data = db_session.query(func.max(Stock_Prices.date)).filter(
            Stock_Prices.company_id == company_id, 
            Stock_Prices.timestamp == interval
        ).scalar()
        
        max_days = interval_max_days[interval]
        
        if not existing_data:
            startDate = endDate - datetime.timedelta(days=max_days)
            try:    
                df = yf.download(ticker, start=startDate, auto_adjust=False, end=endDate, interval=interval)
            except YFPricesMissingError as e:
                print(f"Stock {ticker} appears to be delisted or has no price data for {interval}: {e}")
                continue
            except Exception as e:
                print(f"Unexpected error downloading {ticker} {interval}: {e}")
                continue   
            
            if df.empty:
                print(f"No data returned for {ticker} {interval}")
                continue
            
            for index, row in df.iterrows():
                stock_price = Stock_Prices(
                    company_id=company_id,
                    timestamp=interval,
                    date=index.to_pydatetime().replace(tzinfo=None),
                    open_price=row['Open'],
                    high_price=row['High'],
                    low_price=row['Low'],
                    close_price=row['Close'],
                    volume=int(row['Volume'].iloc[0])
                )
                db_session.add(stock_price)
            db_session.commit()
        else:
            try:
                startDate = existing_data.date()
                print({endDate}, {startDate})
                
                df = yf.download(ticker, start=startDate, auto_adjust=False, end=endDate, interval=interval)
                if df.empty:
                    print(f"No data returned for {ticker} {interval} from {startDate} to {endDate}")
                    continue
                #print(df.head())
                
                for index, row in df.iterrows():
                    if index.to_pydatetime().replace(tzinfo=None) > existing_data:
                        stock_price = Stock_Prices(
                            company_id=company_id,
                            timestamp=interval,
                            date=index.to_pydatetime().replace(tzinfo=None),
                            open_price=row['Open'],
                            high_price=row['High'],
                            low_price=row['Low'],
                            close_price=row['Close'],
                            volume=int(row['Volume'].iloc[0])
                        )
                        db_session.add(stock_price)
                db_session.commit()
            except Exception as e:
                print(f"Error downloading {ticker} {interval}: {e}")
                db_session.rollback()