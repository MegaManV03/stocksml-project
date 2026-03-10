from .scraper import download_stock_data
from .predict import process_predictions

sector_tickers_dict = {
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

sector_tickers = {'Technology': ["AAPL", "MSFT", "GOOGL", "NVDA", "INTC", "AMD"]}

def run_pipeline(timeframe: str):
    print(f"Running pipeline for {timeframe}...")
    # This fills the database with new stock data
    download_stock_data(timeframe, sector_tickers)
    # Then run predictions on new data
    process_predictions(timeframe, company_ids=[1, 2, 3, 4, 5, 6])
    # ... prediction logic ...
    print(f"Pipeline for {timeframe} completed")

if __name__ == "__main__":
    run_pipeline('5m')