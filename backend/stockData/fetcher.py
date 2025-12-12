import yfinance as yf
import asyncio
import aiohttp
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StockDataFetcher:
    def __init__(self, max_concurrent=5):
        self.max_concurrent = max_concurrent
        
    async def fetch_single_stock(self, session, symbol: str) -> Dict[str, Any]:
        """Fetch data for a single stock symbol"""
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info
            
            return {
                "symbol": symbol,
                "company_name": info.get('longName', info.get('shortName', 'N/A')),
                "market_cap": info.get('marketCap', 0),
                "pe_ratio": info.get('trailingPE', info.get('forwardPE', 0)),
                "revenue": info.get('totalRevenue', info.get('revenue', 0))
            }
        except Exception as e:
            logger.error(f"Error fetching {symbol}: {str(e)}")
            return {
                "symbol": symbol,
                "company_name": "N/A",
                "market_cap": 0,
                "pe_ratio": 0,
                "revenue": 0,
                "error": str(e)
            }
    
    async def fetch_batch(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Fetch data for multiple stocks concurrently"""
        async with aiohttp.ClientSession() as session:
            tasks = []
            for symbol in symbols:
                task = self.fetch_single_stock(session, symbol)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle any exceptions
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    processed_results.append({
                        "symbol": symbols[i],
                        "company_name": "N/A",
                        "market_cap": 0,
                        "pe_ratio": 0,
                        "revenue": 0,
                        "error": str(result)
                    })
                else:
                    processed_results.append(result)
            
            return processed_results
    
    def fetch_sync(self, symbols: List[str]) -> List[Dict[str, Any]]:
        """Synchronous wrapper for async fetching"""
        return asyncio.run(self.fetch_batch(symbols))

# Singleton instance for easy import
fetcher = StockDataFetcher()