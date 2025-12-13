from __future__ import annotations
import os
import random
import time
from typing import Dict, Any
import numpy as np
import pandas as pd

FILE_CONFIG = {
    "Server Metrics (Predictive)": {
        "path": "data/Attack_Dataset.csv",
        "possible_keys": ["Scenario Description", "Description", "Title", "Scenario"],  
        "unit": "% Attack Load"
    },
    "IoT Sensors (Anomaly Detection)": {
        "path": "data/HR_Analytics.csv",
        "possible_keys": ["MonthlyIncome", "Monthly Income", "Income"],  
        "possible_attrition": ["Attrition", "attrition", "Left"],  
        "unit": "Monthly Income (USD)"
    },
    "Social Media (Text Analysis)": {
        "path": "data/Sentiment_Data.csv",
        "possible_keys": ["statement", "Statement", "text", "Text", "comment", "Comment"],  
        "unit": "Text Statement"
    },
}

_STREAM_INDICES = {domain: 0 for domain in FILE_CONFIG}
_DATASETS = {}

def auto_detect_column(df: pd.DataFrame, possible_keys: list) -> str:
    for key in possible_keys:
        if key.lower() in [col.lower() for col in df.columns]:
            for col in df.columns:
                if key.lower() in col.lower():
                    return col
    for col in df.columns:
        if df[col].dtype == 'object':
            return col
    return df.columns[0]  

def load_all_datasets():
    global _DATASETS
    print("Auto-loading datasets with column detection...")
    
    for domain, config in FILE_CONFIG.items():
        path = config["path"]
        print(f"\n--- Loading {domain} ---")
        print(f"Path: {path}")
        
        if not os.path.exists(path):
            print(f"File missing: {path}")
            _DATASETS[domain] = None
            continue
            
        try:
            df = pd.read_csv(path)
            print(f"Loaded {len(df)} rows, {len(df.columns)} columns")
            print(f"Available columns: {list(df.columns)}")
            
            if "possible_keys" in config:
                key_col = auto_detect_column(df, config["possible_keys"])
                config["detected_key"] = key_col
                print(f"Auto-detected key column: '{key_col}'")
            else:
                key_col = df.columns[0]
                config["detected_key"] = key_col
            
            df = df.dropna(subset=[key_col]).reset_index(drop=True)
            print(f"Cleaned to {len(df)} valid rows")
            
            if domain == "IoT Sensors (Anomaly Detection)":
                df[key_col] = pd.to_numeric(df[key_col], errors='coerce').fillna(df[key_col].median())
                
                if "possible_attrition" in config:
                    for attr_key in config["possible_attrition"]:
                        for col in df.columns:
                            if attr_key.lower() in col.lower():
                                attrition_col = col
                                if df[attrition_col].dtype == 'object':
                                    df[attrition_col] = df[attrition_col].map({'Yes': 1, 'No': 0}).fillna(0).astype(int)
                                else:
                                    df[attrition_col] = pd.to_numeric(df[attrition_col], errors='coerce').fillna(0).astype(int)
                                config["detected_attrition"] = attrition_col
                                print(f"Auto-detected attrition column: '{attrition_col}'")
                                break
            
            _DATASETS[domain] = df
            print(f"{domain} READY with {len(df)} rows")
            
        except Exception as e:
            print(f"ERROR {domain}: {e}")
            _DATASETS[domain] = None
    
    print("\n ALL DATASETS LOADED SUCCESSFULLY!")

load_all_datasets()

def fetch_real_or_simulated_data(domain: str) -> Dict[str, Any]:
    time.sleep(random.uniform(0.1, 0.5))
    
    df = _DATASETS.get(domain)
    config = FILE_CONFIG.get(domain)
    
    if df is None or df.empty or config is None:
        print(f"Fallback for {domain}")
        if domain == "Social Media (Text Analysis)":
            return {'type': 'text', 'value': 'Sample text data', 'unit': 'Fallback', 'timestamp': time.time()}
        return {'type': 'numeric_series', 'value': 75.0 + random.uniform(-10,10), 'unit': 'Fallback Unit', 'timestamp': time.time(), 'attrition_flag': 0}

    current_index = _STREAM_INDICES[domain]
    if current_index >= len(df):
        current_index = 0
        print(f"{domain} looped back to start")
    
    row = df.iloc[current_index]
    key_col = config.get("detected_key", df.columns[0])
    _STREAM_INDICES[domain] = (current_index + 1)
    
    unit = config["unit"]
    
    if domain == "Social Media (Text Analysis)":
        return {
            'type': 'text',
            'value': str(row[key_col]),
            'unit': unit,
            'timestamp': time.time()
        }
    
    elif domain == "IoT Sensors (Anomaly Detection)":
        attrition_col = config.get("detected_attrition")
        attrition_flag = int(row.get(attrition_col, 0)) if attrition_col and attrition_col in df.columns else 0
        
        return {
            'type': 'numeric_series',
            'value': float(row[key_col]),
            'unit': unit,
            'timestamp': time.time(),
            'attrition_flag': attrition_flag
        }
    
    elif domain == "Server Metrics (Predictive)":
        text_len = len(str(row[key_col]))
        load_percent = 40 + min(text_len / 10, 59)  
        return {
            'type': 'numeric_series',
            'value': load_percent,
            'unit': unit,
            'timestamp': time.time(),
            'attrition_flag': 0
        }
    
    return {'type': 'numeric_series', 'value': 75.0, 'unit': unit, 'timestamp': time.time()}
if __name__ == "__main__":
    print("Testing data fetch...")
    for domain in FILE_CONFIG:
        data = fetch_real_or_simulated_data(domain)
        print(f"{domain}: {data}")
