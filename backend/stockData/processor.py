from fastapi import logger
from .fetcher import fetcher
from typing import List, Dict, Any
import json
import time

class SectorStockProcessor:
    def __init__(self):
        self.fetcher = fetcher
    
    def process_sector_stocks(self, 
                             sector_data: List[Dict[str, Any]], 
                             batch_size: int = 10) -> List[Dict[str, Any]]:
        """
        Process a list of sector_id and symbol pairs
        
        Args:
            sector_data: List of dicts with 'sector_id' and 'symbol' keys
            batch_size: Number of stocks to fetch at once
            
        Returns:
            List of formatted company data matching your required JSON schema
        """
        if not sector_data:
            return []
        
        # Extract all symbols
        symbols = [item['symbol'] for item in sector_data]
        
        all_results = []
        
        # Process in batches to avoid rate limiting
        for i in range(0, len(symbols), batch_size):
            batch_symbols = symbols[i:i+batch_size]
            batch_sector_data = sector_data[i:i+batch_size]
            
            logger.info(f"Fetching batch {i//batch_size + 1}/{(len(symbols)-1)//batch_size + 1}")
            
            # Fetch stock data
            stock_data = self.fetcher.fetch_sync(batch_symbols)
            
            # Combine with sector IDs
            for j, stock_info in enumerate(stock_data):
                formatted_data = {
                    "sector_id": batch_sector_data[j]['sector_id'],
                    "symbol": batch_sector_data[j]['symbol'],
                    "company_name": stock_info.get('company_name', 'N/A'),
                    "market_cap": stock_info.get('market_cap', 0),
                    "pe_ratio": stock_info.get('pe_ratio', 0),
                    "revenue": stock_info.get('revenue', 0)
                }
                
                # Add error if present
                if 'error' in stock_info:
                    formatted_data['error'] = stock_info['error']
                
                all_results.append(formatted_data)
            
            # Be nice to Yahoo - add delay between batches
            if i + batch_size < len(symbols):
                time.sleep(1)
        
        return all_results
    
    def save_to_json(self, 
                    data: List[Dict[str, Any]], 
                    filename: str = 'company_data.json'):
        """Save results to JSON file"""
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"Data saved to {filename}")
    
    def load_sector_data(self, filename: str) -> List[Dict[str, Any]]:
        """Load sector data from JSON file"""
        with open(filename, 'r') as f:
            return json.load(f)

# Example usage function
def example_usage():
    """Example showing how to use the processor"""
    
    # Your input data structure
    example_input = [
        {"sector_id": 1, "symbol": "AAPL"},   # Technology
        {"sector_id": 1, "symbol": "MSFT"},   # Technology
        {"sector_id": 1, "symbol": "NVDA"},   # Technology
        {"sector_id": 2, "symbol": "JNJ"},    # Healthcare
        {"sector_id": 2, "symbol": "PFE"},    # Healthcare
        {"sector_id": 3, "symbol": "JPM"},    # Financials
        {"sector_id": 3, "symbol": "V"}       # Financials
    ]
    
    processor = SectorStockProcessor()
    
    # Process the data
    results = processor.process_sector_stocks(example_input, batch_size=3)
    
    # Print results
    print("Processed Data:")
    for item in results:
        print(json.dumps(item, indent=2))
    
    # Save to file
    processor.save_to_json(results)
    
    return results

# Export main processor
processor = SectorStockProcessor()

if __name__ == "__main__":
    example_usage()