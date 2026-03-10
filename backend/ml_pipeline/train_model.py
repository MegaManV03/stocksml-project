import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from torch.utils.data import Dataset, DataLoader
import pandas as pd
from sklearn.model_selection import train_test_split


class MultiTimePeaksTransformer(nn.Module):
    def __init__(self, input_dim=6, d_model=64, nhead=4, num_layers=2, dim_feedforward=128, dropout=0.1):
        super().__init__()
        
        # Input projection
        self.input_proj = nn.Linear(input_dim, d_model)
        
        # Positional encoding
        self.pos_encoder = PositionalEncoding(d_model, dropout)
        
        # Transformer encoder layers
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # Output layers
        self.fc_out = nn.Linear(d_model, 1)
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x):
        # x shape: (batch_size, seq_len, input_dim)
        x = self.input_proj(x)  # (batch, seq_len, d_model)
        x = self.pos_encoder(x)  # Add positional info
        x = self.transformer_encoder(x)  # Self-attention across sequence
        x = x[:, -1, :]  # Take last timestep's representation
        x = self.dropout(x)
        x = self.fc_out(x)
        return x.squeeze(-1)  # Peak probability


class PositionalEncoding(nn.Module):
    def __init__(self, d_model, dropout=0.1, max_len=5000):
        super().__init__()
        self.dropout = nn.Dropout(p=dropout)
        
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        self.register_buffer('pe', pe)
        
    def forward(self, x):
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)


class PeakDataset(Dataset):
    def __init__(self, df, seq_len=50, forecast_horizon=10, peak_type='positive', feature_cols=None):
        """
        peak_type: 'positive' or 'negative' - which type of peak to predict
        """
        self.df = df.reset_index(drop=True)
        self.seq_len = seq_len
        self.forecast_horizon = forecast_horizon
        self.peak_type = peak_type
        self.feature_cols = feature_cols or ['open_price','high_price','close_price','low_price',
                                             'volume','min5PctChange']
        
        # Create sequences
        self.sequences = []
        self.targets = []
        
        # Get the appropriate peak column based on peak_type
        if peak_type == 'positive':
            peak_col = df['positive_peak'].values
        else:  # negative
            peak_col = df['negative_peak'].values

        for i in range(len(df) - seq_len - forecast_horizon):
            self.sequences.append(i)
            
            # Check if the SPECIFIC peak type occurs in the next forecast_horizon candles
            future_peaks = 0
            for j in range(1, forecast_horizon + 1):
                idx = i + seq_len + j
                if idx < len(df):
                    if peak_col[idx]:  # Only check the specific peak type
                        future_peaks = 1
                        break
            
            self.targets.append(future_peaks)
    
    def __len__(self):
        return len(self.sequences)
    
    def __getitem__(self, idx):
        start_idx = self.sequences[idx]
        end_idx = start_idx + self.seq_len
        
        # Get sequence data
        seq_data = self.df.iloc[start_idx:end_idx][self.feature_cols].values.astype(np.float32)
        target = torch.tensor(self.targets[idx], dtype=torch.float32)
        
        return torch.from_numpy(seq_data), target


def train_epoch(model, dataloader, optimizer, criterion, device):
    model.train()
    total_loss = 0
    
    for batch_idx, (data, targets) in enumerate(dataloader):
        data, targets = data.to(device), targets.to(device)
        
        optimizer.zero_grad()
        outputs = model(data)
        loss = criterion(outputs, targets)
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    return total_loss / len(dataloader)


def validate(model, dataloader, criterion, device,  threshold=0.5):
    model.eval()
    total_loss = 0
    correct = 0
    total = 0

    true_positives = 0
    false_positives = 0
    false_negatives = 0
    
    with torch.no_grad():
        for data, targets in dataloader:
            data, targets = data.to(device), targets.to(device)
            outputs = model(data)

            # For BCEWithLogitsLoss
            if isinstance(criterion, nn.BCEWithLogitsLoss):
                loss = criterion(outputs, targets)
                probs = torch.sigmoid(outputs)
            else:
                loss = criterion(outputs, targets)
                probs = outputs
            
            total_loss += loss.item()
            
            # Apply threshold for predictions
            predicted = (probs > threshold).float()
            correct += (predicted == targets).sum().item()
            total += targets.size(0)
            
            # Calculate precision/recall components
            true_positives += ((predicted == 1) & (targets == 1)).sum().item()
            false_positives += ((predicted == 1) & (targets == 0)).sum().item()
            false_negatives += ((predicted == 0) & (targets == 1)).sum().item()

    accuracy = correct / total
    precision = true_positives / (true_positives + false_positives + 1e-10)
    recall = true_positives / (true_positives + false_negatives + 1e-10)
    f1 = 2 * (precision * recall) / (precision + recall + 1e-10)
    
    return total_loss / len(dataloader), accuracy, precision, recall, f1
    
def validate_peak_level(model, dataloader, criterion, device, threshold=0.5, forecast_horizon=10):
    model.eval()
    total_loss = 0
    total = 0
    
    # For peak-level metrics
    peaks_caught = 0
    total_peaks = 0
    false_signals = 0
    
    with torch.no_grad():
        for data, targets in dataloader:
            data, targets = data.to(device), targets.to(device)
            outputs = model(data)
            
            if isinstance(criterion, nn.BCEWithLogitsLoss):
                loss = criterion(outputs, targets)
                probs = torch.sigmoid(outputs)
            else:
                loss = criterion(outputs, targets)
                probs = outputs
            
            total_loss += loss.item()
            
            # Convert to numpy for peak tracking
            probs_np = probs.cpu().numpy()
            targets_np = targets.cpu().numpy()
            
            # Track peaks across batch
            batch_size = len(targets_np)
            for i in range(batch_size):
                if targets_np[i] == 1:  # This window leads to a peak
                    total_peaks += 1
                    # Check if ANY previous window in this peak's horizon already signaled
                    # This requires tracking peaks by their actual timestamp
                    # Simplified: if probability > threshold, count as caught
                    if probs_np[i] > threshold:
                        peaks_caught += 1
                else:
                    # False positive if model signals on non-peak window
                    if probs_np[i] > threshold:
                        false_signals += 1
    
    precision = peaks_caught / (peaks_caught + false_signals + 1e-10)
    recall = peaks_caught / (total_peaks + 1e-10)
    f1 = 2 * (precision * recall) / (precision + recall + 1e-10)
    
    return total_loss / len(dataloader), precision, recall, f1

if __name__ == "__main__":
    timestamp = '5m'
    # Assuming you have your processed DataFrame with peaks
    df_with_peaks = pd.read_csv(f'peaks_{timestamp}_all_companies.csv')

    #drop first five as pct doesnt exist
    df_with_peaks = df_with_peaks.iloc[5:].reset_index(drop=True)
    # Normalize price and volume columns
    price_cols = ['open_price', 'high_price', 'low_price', 'close_price']
    for col in price_cols:
        df_with_peaks[col] = (df_with_peaks[col] - df_with_peaks[col].min()) / (df_with_peaks[col].max() - df_with_peaks[col].min())
    
    # Normalize volume similarly
    df_with_peaks['volume'] = (df_with_peaks['volume'] - df_with_peaks['volume'].min()) / (df_with_peaks['volume'].max() - df_with_peaks['volume'].min())
    

    companies = df_with_peaks['company_id'].unique() 

    # Split companies: 70% train, 15% val, 15% test
    train_companies, temp_companies = train_test_split(companies, test_size=0.3, random_state=42)
    val_companies, test_companies = train_test_split(temp_companies, test_size=0.5, random_state=42)

    # Filter data by companies
    train_df = df_with_peaks[df_with_peaks['company_id'].isin(train_companies)]
    val_df = df_with_peaks[df_with_peaks['company_id'].isin(val_companies)]
    test_df = df_with_peaks[df_with_peaks['company_id'].isin(test_companies)]

    # Positive peaks dataset
    train_pos_dataset = PeakDataset(train_df, seq_len=50, forecast_horizon=10, peak_type='positive')
    val_pos_dataset = PeakDataset(val_df, seq_len=50, forecast_horizon=10, peak_type='positive')
    test_pos_dataset = PeakDataset(test_df, seq_len=50, forecast_horizon=10, peak_type='positive')

    # Negative peaks dataset  
    train_neg_dataset = PeakDataset(train_df, seq_len=50, forecast_horizon=10, peak_type='negative')
    val_neg_dataset = PeakDataset(val_df, seq_len=50, forecast_horizon=10, peak_type='negative')
    test_neg_dataset = PeakDataset(test_df, seq_len=50, forecast_horizon=10, peak_type='negative')

    # For POSITIVE model
    train_pos_targets = [train_pos_dataset[i][1].item() for i in range(len(train_pos_dataset))]
    n_neg_pos = len(train_pos_targets) - sum(train_pos_targets)
    n_pos_pos = sum(train_pos_targets)
    weight_pos_pos = n_neg_pos / n_pos_pos

    train_pos_loader = DataLoader(train_pos_dataset, batch_size=32, shuffle=True)
    val_pos_loader = DataLoader(val_pos_dataset, batch_size=32, shuffle=False)
    test_pos_loader = DataLoader(test_pos_dataset, batch_size=32, shuffle=False)

    # For NEGATIVE model  
    train_neg_targets = [train_neg_dataset[i][1].item() for i in range(len(train_neg_dataset))]
    n_neg_neg = len(train_neg_targets) - sum(train_neg_targets)
    n_pos_neg = sum(train_neg_targets)
    weight_pos_neg = n_neg_neg / n_pos_neg

    train_neg_loader = DataLoader(train_neg_dataset, batch_size=32, shuffle=True)
    val_neg_loader = DataLoader(val_neg_dataset, batch_size=32, shuffle=False)
    test_neg_loader = DataLoader(test_neg_dataset, batch_size=32, shuffle=False)



    # Train
    epochs = 1
    # POSITIVE MODEL
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    model_pos = MultiTimePeaksTransformer(input_dim=6, d_model=64, nhead=4, num_layers=2, dim_feedforward=128, dropout=0.1).to(device)
    criterion_pos = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([weight_pos_pos]).to(device))
    optimizer_pos = torch.optim.Adam(model_pos.parameters(), lr=0.001)

    print("\n--- TRAINING POSITIVE MODEL (LONG SIGNALS) ---")
    for epoch in range(epochs):
        train_loss = train_epoch(model_pos, train_pos_loader, optimizer_pos, criterion_pos, device)
        val_loss, val_acc, val_prec, val_rec, val_f1 = validate(model_pos, val_pos_loader, criterion_pos, device)
        print(f"Epoch {epoch+1}: Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}, F1: {val_f1:.4f}")

    thresholds = np.arange(0.1, 0.9, 0.05)

    # Find best threshold for positive model
    best_threshold_pos = 0.5
    best_f1_pos = 0
    # For positive model threshold tuning
    for thresh in thresholds:
        _, _, _, val_f1 = validate_peak_level(
            model_pos, val_pos_loader, criterion_pos, device, 
            threshold=thresh, forecast_horizon=10
        )
        if val_f1 > best_f1_pos:
            best_f1_pos = val_f1
            best_threshold_pos = thresh

    # Save positive model
    torch.save({'model_state_dict': model_pos.state_dict(), 'best_threshold': best_threshold_pos, 
                'best_f1': best_f1_pos, 'type': 'positive'}, f'{timestamp}_peak_transformer_pos.pt')

    # NEGATIVE MODEL (repeat with _neg versions)
    model_neg = MultiTimePeaksTransformer(input_dim=6, d_model=64, nhead=4, num_layers=2, dim_feedforward=128, dropout=0.1).to(device)
    criterion_neg = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([weight_pos_neg]).to(device))
    optimizer_neg = torch.optim.Adam(model_neg.parameters(), lr=0.001)

    print("\n--- TRAINING NEGATIVE MODEL (SHORT SIGNALS) ---")
    for epoch in range(epochs):
        train_loss = train_epoch(model_neg, train_neg_loader, optimizer_neg, criterion_neg, device)
        val_loss, val_acc, val_prec, val_rec, val_f1 = validate(model_neg, val_neg_loader, criterion_neg, device)
        print(f"Epoch {epoch+1}: Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}, F1: {val_f1:.4f}")

    # Find best threshold for negative model
    best_threshold_neg = 0.5
    best_f1_neg = 0
    for thresh in thresholds:
        _, _, _, val_f1 = validate_peak_level(
            model_neg, val_neg_loader, criterion_neg, device, 
            threshold=thresh, forecast_horizon=10
        )
        if val_f1 > best_f1_neg:
            best_f1_neg = val_f1
            best_threshold_neg = thresh

    # Save negative model
    torch.save({'model_state_dict': model_neg.state_dict(), 'best_threshold': best_threshold_neg,
                'best_f1': best_f1_neg, 'type': 'negative'}, f'{timestamp}_peak_transformer_neg.pt')

    test_loss_pos, test_prec_pos, test_rec_pos, test_f1_pos = validate_peak_level(
        model_pos, test_pos_loader, criterion_pos, device, 
        threshold=best_threshold_pos, forecast_horizon=10
    )

    test_loss_neg, test_prec_neg, test_rec_neg, test_f1_neg = validate_peak_level(
        model_neg, test_neg_loader, criterion_neg, device, 
        threshold=best_threshold_neg, forecast_horizon=10
    )
    
    print("\n--- POSITIVE MODEL TEST (peak-level) ---")
    print(f"Precision: {test_prec_pos:.4f}, Recall: {test_rec_pos:.4f}, F1: {test_f1_pos:.4f}")

    print("\n--- NEGATIVE MODEL TEST (peak-level) ---") 
    print(f"Precision: {test_prec_neg:.4f}, Recall: {test_rec_neg:.4f}, F1: {test_f1_neg:.4f}")