import torch
import pandas as pd
import numpy as np
from .train_model import MultiTimePeaksTransformer
import sqlite3
import os
from datetime import datetime, timezone
from typing import List, Optional, Union


def load_trained_models(pos_path='peak_transformer_pos_state.pt', neg_path='peak_transformer_neg_state.pt'):
    """Load both trained models with their configs"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    # Create models
    model_pos = MultiTimePeaksTransformer(
        input_dim=6, d_model=64, nhead=4, num_layers=2, dim_feedforward=128, dropout=0.1
    ).to(device)
    
    model_neg = MultiTimePeaksTransformer(
        input_dim=6, d_model=64, nhead=4, num_layers=2, dim_feedforward=128, dropout=0.1
    ).to(device)
    
    # Load state dicts with numpy fix
    pos_state = torch.load(pos_path, map_location='cpu', weights_only=False)
    neg_state = torch.load(neg_path, map_location='cpu', weights_only=False)
    
    # Fix numpy object arrays
    def fix_state_dict(state_dict):
        new_state = {}
        for key, value in state_dict.items():
            if isinstance(value, np.ndarray):
                if value.dtype == np.object_:
                    # Try to convert to float32
                    try:
                        value = value.astype(np.float32)
                    except:
                        # If conversion fails, try to get first element if it's a 0-dim array
                        if value.size == 1:
                            value = np.float32(value.item())
                        else:
                            print(f"Warning: Could not convert {key} of shape {value.shape}")
                            continue
                new_state[key] = torch.from_numpy(value)
            elif isinstance(value, torch.Tensor):
                if value.dtype not in [torch.float32, torch.float64]:
                    new_state[key] = value.float()
                else:
                    new_state[key] = value
            else:
                # Try to convert other types to tensor
                try:
                    new_state[key] = torch.tensor(value, dtype=torch.float32)
                except:
                    print(f"Warning: Skipping {key} of type {type(value)}")
        return new_state
    
    pos_state = fix_state_dict(pos_state)
    neg_state = fix_state_dict(neg_state)
    
    # Load with strict=False
    model_pos.load_state_dict(pos_state, strict=False)
    model_neg.load_state_dict(neg_state, strict=False)
    
    model_pos.eval()
    model_neg.eval()
    
    # Get thresholds
    try:
        orig_pos = torch.load('peak_transformer_pos.pt', map_location='cpu', weights_only=False)
        orig_neg = torch.load('peak_transformer_neg.pt', map_location='cpu', weights_only=False)
        best_threshold_pos = orig_pos.get('best_threshold', 0.35)
        best_threshold_neg = orig_neg.get('best_threshold', 0.35)
    except:
        best_threshold_pos = 0.35
        best_threshold_neg = 0.35
        print("Using default thresholds: 0.35")
    
    return {
        'positive': {'model': model_pos, 'threshold': best_threshold_pos},
        'negative': {'model': model_neg, 'threshold': best_threshold_neg},
        'device': device,
        'config': {'input_dim': 6, 'd_model': 64, 'nhead': 4, 'num_layers': 2, 'seq_len': 50}
    }

def prepare_sequence_for_row(df, company_id, timestamp, target_row, seq_len=50, feature_cols=None):
    """Get sequence ending just before the target row to predict that row"""
    feature_cols = feature_cols or ['open_price','high_price','close_price','low_price',
                                     'volume','min5PctChange']
    
    # Filter and sort
    company_df = df[(df['company_id'] == company_id) & 
                    (df['timestamp'] == timestamp)].sort_values('date').reset_index(drop=True)
    
    # Sequence should end at target_row - 1
    end_idx = target_row - 1
    start_idx = end_idx - seq_len + 1
    
    if start_idx < 0 or end_idx >= len(company_df):
        raise ValueError(f"Cannot create sequence for row {target_row}. Need rows {start_idx} to {end_idx}")
    
    sequence_data = company_df.iloc[start_idx:end_idx + 1][feature_cols].values
    
    # Normalize
    price_cols = ['open_price', 'high_price', 'low_price', 'close_price']
    for i, col in enumerate(feature_cols):
        if col in price_cols:
            col_min = company_df[col].min()
            col_max = company_df[col].max()
            sequence_data[:, i] = (sequence_data[:, i] - col_min) / (col_max - col_min + 1e-10)
        elif col == 'volume':
            vol_min = company_df['volume'].min()
            vol_max = company_df['volume'].max()
            sequence_data[:, i] = (sequence_data[:, i] - vol_min) / (vol_max - vol_min + 1e-10)
    
    return torch.from_numpy(sequence_data).float()

def predict_peaks(models, sequence):
    """Get predictions from both models"""
    device = models['device']
    sequence = sequence.unsqueeze(0).to(device)  # Add batch dimension
    
    with torch.no_grad():
        # Get predictions
        pos_prob = torch.sigmoid(models['positive']['model'](sequence)).item()
        neg_prob = torch.sigmoid(models['negative']['model'](sequence)).item()
    
    signals = []
    
    # Check positive model (BUY signals)
    if pos_prob > models['positive']['threshold']:
        signals.append({
            'type': 'BUY',
            'confidence': pos_prob,
            'threshold': models['positive']['threshold'],
            'message': f"BUY signal: {pos_prob:.1%} confidence (threshold {models['positive']['threshold']:.1%})"
        })
    
    # Check negative model (SELL signals)
    if neg_prob > models['negative']['threshold']:
        signals.append({
            'type': 'SELL',
            'confidence': neg_prob,
            'threshold': models['negative']['threshold'],
            'message': f"SELL signal: {neg_prob:.1%} confidence (threshold {models['negative']['threshold']:.1%})"
        })
    
    return {
        'probabilities': {'buy': pos_prob, 'sell': neg_prob},
        'signals': signals,
        'has_signal': len(signals) > 0
    }

def process_predictions(timestamp: str, company_ids: Union[int, List[int]], 
                        db_path: str = 'test.db', model_paths: tuple = None):
    """
    Main function to process predictions for specified companies and timestamp
    
    Args:
        timestamp: Time interval (e.g., '5m', '15m', '1h')
        company_ids: Single company ID or list of company IDs
        db_path: Path to SQLite database
        model_paths: Optional tuple of (pos_model_path, neg_model_path)
    """
    if model_paths is None:
        pos_path, neg_path = f'{timestamp}_peak_transformer_pos.pt', f'{timestamp}_peak_transformer_neg.pt'
    else:
        pos_path, neg_path = model_paths
    
    # Convert single company_id to list
    if isinstance(company_ids, int):
        company_ids = [company_ids]
    
    # Load models once
    print("Loading models...")
    models = load_trained_models(pos_path, neg_path)
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    os.makedirs('peak_data', exist_ok=True)
    
    total_processed = 0
    total_predictions = 0
    
    for company_id in company_ids:
        print(f"\nProcessing company {company_id} for timestamp {timestamp}...")
        
        # Get data for this company and timestamp
        df = pd.read_sql_query(f"""
            SELECT * FROM stock_prices 
            WHERE company_id = {company_id} 
            AND timestamp = '{timestamp}'
            ORDER BY date
        """, conn)
        
        if len(df) == 0:
            print(f"No data found for company {company_id} with timestamp {timestamp}")
            continue
        
        # Get all predicted stock_price_ids for this company/timestamp
        cursor = conn.cursor()
        cursor.execute("""
            SELECT pp.stock_price_id FROM price_predictions pp
            JOIN stock_prices sp ON sp.id = pp.stock_price_id
            WHERE sp.company_id = ? AND sp.timestamp = ?
        """, (company_id, timestamp))
        predicted_ids = [row[0] for row in cursor.fetchall()]
        
        # Calculate percentage change
        df['date'] = pd.to_datetime(df['date'])
        df['timestamp'] = pd.Categorical(df['timestamp'])
        
        window = 5
        price_col = 'close_price'
        pct_change_col = 'min5PctChange'
        df[pct_change_col] = (df[price_col] / df[price_col].shift(window) - 1) * 100
        
        # Find rows without predictions
        rows_to_predict = df[~df['id'].isin(predicted_ids)]
        
        if len(rows_to_predict) == 0:
            print(f"All rows for company {company_id} already have predictions")
            continue
        
        print(f"Found {len(rows_to_predict)} rows needing predictions")
        company_predictions = 0
        
        for idx in rows_to_predict.index:
            if idx >= 50:  # Need at least 50 prior rows
                stock_price_id = int(df.iloc[idx]['id'])
                try:
                    sequence = prepare_sequence_for_row(df, company_id, timestamp, idx+1)
                    result = predict_peaks(models, sequence)
                    
                    cursor.execute("""
                        INSERT INTO price_predictions 
                        (stock_price_id, prediction_date, long_probability, short_probability, model_version)
                        VALUES (?, ?, ?, ?, ?)
                    """, (
                        stock_price_id,
                        datetime.now(timezone.utc),
                        result['probabilities']['buy'],
                        result['probabilities']['sell'],
                        "peak_transformer_v1"
                    ))
                    company_predictions += 1
                    
                except Exception as e:
                    print(f"Error processing row {idx} for company {company_id}: {e}")
                    continue
            
        
        conn.commit()
        total_predictions += company_predictions
        total_processed += 1
        print(f"Added {company_predictions} predictions for company {company_id}")
    
    conn.close()
    print(f"\nCompleted processing {total_processed} companies")
    print(f"Total predictions added: {total_predictions}")
    
    return {
        'companies_processed': total_processed,
        'predictions_added': total_predictions,
        'timestamp': timestamp,
        'company_ids': company_ids
    }


# Example usages
if __name__ == "__main__":
    # Process single company
    result = process_predictions(timestamp='15m', company_ids=[1, 2])
    
    # Process multiple companies
    # result = process_predictions(timestamp='5m', company_ids=[1, 2, 3])
    
    # Process with custom database path
    # result = process_predictions(timestamp='5m', company_ids=2, db_path='custom_path.db')
    
    print(f"Processing result: {result}")
    