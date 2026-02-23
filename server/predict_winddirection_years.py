import os
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = "models/winddirection_model.joblib"
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

    df["winddir"] = pd.to_numeric(df["winddir"], errors="coerce")
    rad = np.deg2rad(df["winddir"])
    df["winddir_sin"] = np.sin(rad)
    df["winddir_cos"] = np.cos(rad)

    # Lags for winddirection
    direction_lags = [1, 2, 3, 6, 12]

    for lag in direction_lags:
       df[f"wd_sin_lag{lag}"] = df["winddir_sin"].shift(lag)
       df[f"wd_cos_lag{lag}"] = df["winddir_cos"].shift(lag)
       df[f"windspeed_lag{lag}"] = df["windspeed"].shift(lag)

    # Rolling stats (use previous values, shift(1) to prevent leakage)
    df["wd_sin_roll3"] = df["winddir_sin"].rolling(3).mean()
    df["wd_cos_roll3"] = df["winddir_cos"].rolling(3).mean()
    df["windspeed_roll3"] = df["windspeed"].rolling(3).mean()

    return df

def sincos_to_deg(sin_v, cos_v):
    ang = np.degrees(np.arctan2(sin_v, cos_v))
    return (ang + 360) % 360

def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    bundle = joblib.load(MODEL_PATH)
    rf_sin = bundle["rf_sin"]
    rf_cos = bundle["rf_cos"]
    xgb_sin = bundle["xgb_sin"]
    xgb_cos = bundle["xgb_cos"]
    feature_cols = bundle["feature_cols"]


    for year in YEARS:
        in_path = os.path.join(DATA_DIR, f"{year}.csv")
        if not os.path.exists(in_path):
            print(f"[SKIP] Missing: {in_path}")
            continue

        df = pd.read_csv(in_path)
        if "datetime" not in df.columns or "winddir" not in df.columns:
            raise ValueError(f"{in_path} must contain 'datetime' and 'winddir' columns.")

        df["winddir"] = pd.to_numeric(df["winddir"], errors="coerce")
        
        df = add_datetime_features(df)
        df = add_lag_roll_features(df)  

        missing = [c for c in feature_cols if c not in df.columns]
        if missing:
            raise ValueError(f"{in_path} missing required feature columns: {missing}")

        df2 = df.dropna(subset=feature_cols + ["winddir"]).copy()

        X = df2[feature_cols].to_numpy()
        
        rf_sin_pred = rf_sin.predict(X)
        xgb_sin_pred = xgb_sin.predict(X)
        rf_cos_pred = rf_cos.predict(X)
        xgb_cos_pred = xgb_cos.predict(X)

        ens_sin = (rf_sin_pred + xgb_sin_pred) / 2
        ens_cos = (rf_cos_pred + xgb_cos_pred) / 2

        pred_deg = sincos_to_deg(ens_sin, ens_cos)

        out = pd.DataFrame({
            "datetime": df2["datetime"].astype(str),
            "winddir": df2["winddir"].astype(float),
            "pred_winddir": pred_deg.astype(float),
        })

        out_path = os.path.join(OUT_DIR, f"winddirection_{year}_pred.csv")
        out.to_csv(out_path, index=False)
        print(f"[OK] Saved {out_path} ({len(out)} rows)")

if __name__ == "__main__":
    main()

    