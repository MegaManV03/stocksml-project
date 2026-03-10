import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import numpy as np
import pandas as pd
import sqlite3
from sklearn.preprocessing import StandardScaler
import os



def filter_by_timestamp(df, timestamp, company_id):
    """Filter dataframe by timestamp and company_id, then sort by date."""
    return df[(df['timestamp'] == timestamp) & (df['company_id'] == company_id)].sort_values('date').reset_index(drop=True)


def add_peak_detection_features(df, price_col='close_price', window=5, threshold=0.5, pct_change_col=None):
    """
    Add percentage change and peak detection features to the dataframe.
    """
    # Create a copy to avoid modifying the original
    result_df = df
    
    # Generate column names
    if pct_change_col is None:
        pct_change_col = f'min{window}PctChange'
    
    positive_peak_col = f'positive_peak'
    negative_peak_col = f'negative_peak'
    
    # Calculate percentage change
    result_df[pct_change_col] = (result_df[price_col] / result_df[price_col].shift(window) - 1) * 100


    
    # Detect positive peaks
    result_df[positive_peak_col] = (result_df[pct_change_col] > threshold) & (result_df[pct_change_col].notna())
    
    # Detect negative peaks
    result_df[negative_peak_col] = (result_df[pct_change_col] < -threshold) & (result_df[pct_change_col].notna())
    
    return result_df







def process_peaks(df, n):
    i = 0
    print("before",len(df))
    while i < len(df):
        for j in range(1, n+1):
            if i+j >= len(df):
                break
            firstPoint = df.iloc[i]['positive_peak']
            frontPoint = df.iloc[i+j]['positive_peak']
            firstNeg = df.iloc[i]['negative_peak']
            frontNeg = df.iloc[i+j]['negative_peak']

            firstPointPct = df.iloc[i]['min5PctChange']
            frontPointPct = df.iloc[i+j]['min5PctChange']
            if firstPoint == True and frontPoint == True:
                if firstPointPct >= frontPointPct:
                    df.at[i+j, 'positive_peak'] = False
                else:
                    df.at[i, 'positive_peak'] = False
                    break
            
            if firstNeg == True and frontNeg == True:
                if firstPointPct <= frontPointPct:
                    df.at[i+j, 'negative_peak'] = False
                else:
                    df.at[i, 'negative_peak'] = False
                    break

        i+=1
    print("after",len(df))

            

            


if __name__ == "__main__":
    conn = sqlite3.connect('test.db')
    os.makedirs('peak_data', exist_ok=True)


    df = pd.read_sql_query("SELECT * FROM stock_prices", conn)
    conn.close()
    df['date'] = pd.to_datetime(df['date'])
    df['timestamp'] = pd.Categorical(df['timestamp'])

    companiesId = 40 # from 1 to 40
    timestamp = '5m'

    all_peaks = []

    for i in range(1, companiesId):

    
        # Filter by df_filtered
        df_filtered = filter_by_timestamp(df, timestamp, i)
        
        # Add peak detection features
        df_with_peaks = add_peak_detection_features(
            df_filtered, 
            price_col='close_price', 
            window=5, 
            threshold=0.5
        )
        print(f"Before: {df_with_peaks.shape}")
        df_with_peaks = df_with_peaks.iloc[5:].reset_index(drop=True)
        process_peaks(df_with_peaks, 5)
        print(f"After: {df_with_peaks.shape}")

        print(df_with_peaks['negative_peak'].value_counts())
        print(df_with_peaks['positive_peak'].value_counts())
        print('done with: ', {i})
        all_peaks.append(df_with_peaks)

        final_df = pd.concat(all_peaks, ignore_index=True)
        final_df.to_csv(f'peaks_{timestamp}_all_companies.csv')

