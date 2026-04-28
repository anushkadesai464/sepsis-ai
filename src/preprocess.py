import pandas as pd
import numpy as np
import joblib

FEATURE_COLS = [
    'HR', 'O2Sat', 'SBP', 'MAP', 'DBP',
    'Resp', 'Age', 'Gender', 'ICULOS',
    'HospAdmTime', 'WBC', 'Glucose',
    'Potassium', 'ShockIndex', 'PulsePressure',
    'LowSpO2', 'HighResp'
]

def engineer_features(data: dict) -> pd.DataFrame:
    """Takes raw input dict, returns feature-engineered DataFrame"""
    df = pd.DataFrame([data])

    # Engineered features
    df['ShockIndex']    = df['HR'] / (df['SBP'] + 1e-6)
    df['PulsePressure'] = df['SBP'] - df['DBP']
    df['LowSpO2']       = (df['O2Sat'] < 95).astype(int)
    df['HighResp']      = (df['Resp'] > 22).astype(int)

    # Fill defaults for optional fields
    for col in FEATURE_COLS:
        if col not in df.columns:
            df[col] = 0.0

    return df[FEATURE_COLS]


def scale_features(df: pd.DataFrame, scaler_path: str) -> pd.DataFrame:
    """Scale features using saved scaler"""
    scaler = joblib.load(scaler_path)
    scaled = scaler.transform(df)
    return pd.DataFrame(scaled, columns=df.columns)