import os
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = "models/windspeed_model.joblib"
DATA_DIR = "data"
OUT_DIR = "output"
YEARS = [2022, 2023, 2024, 2025]

def add_datetime_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce")
    df = df.sort_values("datetime").reset_index(drop=True)

    df["hour"] = df["datetime"].dt.hour
    df["dayofweek"] = df["datetime"].dt.dayofweek
    df["month"] = df["datetime"].dt.month
    df["day"] = df["datetime"].dt.day

    df["hour_sin"] = np.sin(2*np.pi*df["hour"]/24)
    df["hour_cos"] = np.cos(2*np.pi*df["hour"]/24)
    df["month_sin"] = np.sin(2*np.pi*df["month"]/12)
    df["month_cos"] = np.cos(2*np.pi*df["month"]/12)
    return df

def add_lag_roll_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = df.sort_values("datetime").reset_index(drop=True)

    # Lags for windspeed and windgust
    wind_lags = [1, 2, 3, 6, 12, 24]
    gust_lags = [1, 2, 3, 6, 12, 24]

    for lag in wind_lags:
        df[f"wind_lag_{lag}"] = df["windspeed"].shift(lag)

    for lag in gust_lags:
        df[f"gust_lag_{lag}"] = df["windgust"].shift(lag)

    # Rolling stats (use previous values, shift(1) to prevent leakage)
    windows = [3, 6, 12, 24]
    for w in windows:
        df[f"wind_roll_mean_{w}"] = df["windspeed"].shift(1).rolling(w).mean()
        df[f"wind_roll_std_{w}"]  = df["windspeed"].shift(1).rolling(w).std()

    return df

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    bundle = joblib.load(MODEL_PATH)
    rf = bundle["rf"]
    xgb_model = bundle["xgb"]
    feature_cols = bundle["feature_cols"]
    w = bundle.get("weights", {"rf": 0.5, "xgb": 0.5})
    w_rf, w_xgb = w["rf"], w["xgb"]

    for year in YEARS:
        in_path = os.path.join(DATA_DIR, f"{year}.csv")
        if not os.path.exists(in_path):
            print(f"[SKIP] Missing: {in_path}")
            continue

        df = pd.read_csv(in_path)
        if "datetime" not in df.columns or "windspeed" not in df.columns:
            raise ValueError(f"{in_path} must contain 'datetime' and 'windspeed' columns.")

        df = add_datetime_features(df)
        df = add_lag_roll_features(df)

        # Ensure feature columns exist
        missing = [c for c in feature_cols if c not in df.columns]
        if missing:
            raise ValueError(f"{in_path} missing required feature columns: {missing}")

        # Drop rows with missing features
        df2 = df.dropna(subset=feature_cols + ["windspeed"]).copy()

        X = df2[feature_cols].to_numpy()
        rf_pred = rf.predict(X)
        xgb_pred = xgb_model.predict(X)

        ens_pred = (w_rf * rf_pred) + (w_xgb * xgb_pred)

        out = pd.DataFrame({
            "datetime": df2["datetime"].astype(str),
            "windspeed": df2["windspeed"].astype(float),
            "pred_windspeed": ens_pred.astype(float),
        })

        out_path = os.path.join(OUT_DIR, f"windspeed_{year}_pred.csv")
        out.to_csv(out_path, index=False)
        print(f"[OK] Saved {out_path} ({len(out)} rows)")

if __name__ == "__main__":
    main()