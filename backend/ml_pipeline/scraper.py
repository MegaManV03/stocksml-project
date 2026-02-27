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


sector_to_tickers = {
    'Technology': ["AAPL", "MSFT", "GOOGL", "NVDA", "INTC", "AMD", "ADBE", "CRM", "CSCO", "ORCL"],  # Technology
    'Healthcare': ["JNJ", "PFE", "UNH", "ABT", "TMO", "MRK", "ABBV", "LLY", "DHR", "BMY"],  # Healthcare
    'Financials': ["JPM", "BAC", "WFC", "C", "GS", "MS", "BLK", "AXP", "SPGI", "MMC"],  # Financials
    'Consumer Discretionary': ["AMZN", "TSLA", "HD", "MCD", "NKE", "LOW", "SBUX", "TGT", "BKNG", "MAR"],  # Consumer Discretionary
    'Consumer Staples': ["PG", "KO", "PEP", "WMT", "COST", "PM", "MDLZ", "CL", "MO", "KMB"],  # Consumer Staples
    'Industrials': ["UPS", "RTX", "HON", "CAT", "BA", "GE", "MMM", "DE", "LMT", "UNP"],  # Industrials
    'Energy': ["XOM", "CVX", "COP", "SLB", "EOG", "PSX", "MPC", "VLO", "OKE", "WMB"],  # Energy
    'Utilities': ["NEE", "DUK", "SO", "D", "AEP", "EXC", "SRE", "XEL", "WEC", "ED"],  # Utilities
    'Real Estate': ["PLD", "AMT", "CCI", "EQIX", "PSA", "SPG", "O", "AVB", "EQR", "DLR"],  # Real Estate
    'Materials': ["LIN", "APD", "SHW", "ECL", "NEM", "FCX", "DD", "NUE", "STLD", "MLM"],  # Materials
    'Communication Services': ["GOOG", "META", "NFLX", "DIS", "CMCSA", "T", "VZ", "CHTR", "TMUS", "EA"]  # Communication Services
}

#reversing the orginal mapping
ticker_to_sector = {}
for sector_id, tickers_list in sector_to_tickers.items():
    for ticker in tickers_list:
        ticker_to_sector[ticker] = sector_id

#flat list of tickers
tickers = list(ticker_to_sector.keys())

intervals = ['1m', '5m', '15m', '30m', '1h', '4h', '1d']

def get_interval_minutes(interval):
    if interval.endswith('m'):
        return int(interval[:-1])
    elif interval.endswith('h'):
        return int(interval[:-1]) * 60
    elif interval.endswith('d'):
        return int(interval[:-1]) * 1440
    elif interval.endswith('wk'):
        return int(interval[:-2]) * 10080
    elif interval.endswith('mo'):
        return int(interval[:-2]) * 43200  # Approximate
    return 0

interval_max_days = {
    '1m': 7,
    '5m': 60,
    '15m': 60,
    '30m': 60,
    '1h': 730,
    '4h': 730,
    '1d': 1825,  # 5 years
}


data_frames = {}

###
#Ensure sectors exist
for sector_name in sector_to_tickers.keys():
    sector = db_session.query(Sector).filter(Sector.name == sector_name).first()
    if not sector:
        sector = Sector(name=sector_name)
        db_session.add(sector)
        db_session.commit()
        db_session.refresh(sector)

for ticker in tickers:

    #check if a company exists for the current ticker
    #creates it if it doesn't
    #gets the company_id for use in downloading price data.
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

    #handles each interval separately,
    #calculates appropriate date ranges
    #checks for existing data per interval
    for interval in intervals:

        desired_entries = 3749
        total_minutes = desired_entries * get_interval_minutes(interval)

        endDate = datetime.datetime.now()

        # Check if company has data
        existing_data = db_session.query(Stock_Prices).filter(Stock_Prices.company_id == company_id, Stock_Prices.timestamp == interval).first()
        max_days = interval_max_days[interval]

        if not existing_data:
            startDate = endDate - datetime.timedelta(days=max_days)
            time.sleep(2)
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
                startDate = endDate - datetime.timedelta(days=max_days)
                # Block two: Get only new data
                last_date = db_session.query(func.max(Stock_Prices.date)).filter(Stock_Prices.company_id == company_id, Stock_Prices.timestamp == interval).scalar()
                time.sleep(1)
                df = yf.download(ticker, start=last_date, auto_adjust=False,end=endDate, interval=interval)
                if df.empty:
                    print(f"No data returned for {ticker} {interval}")
                    continue
                # Process and insert only new records
                for index, row in df.iterrows():
                    if index.to_pydatetime().replace(tzinfo=None) > last_date:
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