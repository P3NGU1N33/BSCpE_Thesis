import os
import joblib
import pandas as pd
import numpy as np
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TABLE = os.getenv("SUPABASE_TABLE", "iswai_data")
PK_COL = os.getenv("SUPABASE_PK_COL", "id")
TIME_COL = "timestamp"

WINDDIR_MODEL_PATH = "models/winddirection_model.joblib"
WINDSPEED_MODEL_PATH = "models/windspeed_model.joblib"

#SHARED DATETIME FEATURES 
def add_datetime_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.sort_values("timestamp").reset_index(drop=True)

    df["hour"] = df["timestamp"].dt.hour
    df["dayofweek"] = df["timestamp"].dt.dayofweek
    df["month"] = df["timestamp"].dt.month
    df["day"] = df["timestamp"].dt.day

    df["hour_sin"] = np.sin(2*np.pi*df["hour"]/24)
    df["hour_cos"] = np.cos(2*np.pi*df["hour"]/24)
    df["month_sin"] = np.sin(2*np.pi*df["month"]/12)
    df["month_cos"] = np.cos(2*np.pi*df["month"]/12)
    return df

#WIND DIRECTION FEATURES
def add_winddir_lag_roll_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = df.sort_values("timestamp").reset_index(drop=True)

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

def sincos_to_deg(sin_v: float, cos_v: float) -> float:
    ang = np.degrees(np.arctan2(sin_v, cos_v))
    return float((ang + 360) % 360)

def normalize_unit_circle(sin_v: float, cos_v: float):
    mag = np.sqrt(sin_v * sin_v + cos_v * cos_v)
    return float(sin_v / (mag + 1e-9)), float(cos_v / (mag + 1e-9))

#WIND SPEED FEATURES
def add_windspeed_lag_roll_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df = df.sort_values("timestamp").reset_index(drop=True)

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

#SUPABASE I/0

def fetch_latest_rows(supabase, limit_rows: int = 80) -> pd.DataFrame:
    # fetch newest N by datetime desc, then reverse for ascending
    resp = (
        supabase.table(TABLE)
        .select("*")
        .order("timestamp", desc=True)
        .limit(limit_rows)
        .execute()
    )

    rows = resp.data or []
    if not rows:
        raise RuntimeError("No rows returned from Supabase.")

    df = pd.DataFrame(rows)
    # Keep a copy of "latest row" info (top row is newest)
    # Then reverse for feature engineering
    df = df.iloc[::-1].reset_index(drop=True)
    return df


# def update_row_prediction(supabase, pk_value, pred_windspeed: float, pred_winddir: float, pred_timestamp: str):
#     payload = {
#         "pred_windspeed": float(pred_windspeed),
#         "pred_winddir": float(pred_winddir),
#         "pred_timestamp": pred_timestamp,
#     }
#     supabase.table(TABLE).update(payload).eq(PK_COL, pk_value).execute()

#MAIN PIPELINE
def predict_latest_and_update(limit_rows: int = 80):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Load model bundles
    ws_bundle = joblib.load(WINDSPEED_MODEL_PATH)
    wd_bundle = joblib.load(WINDDIR_MODEL_PATH)

    # Pull rows
    df = fetch_latest_rows(supabase, limit_rows=limit_rows)
    # Identify latest row PK (from original newest row)
    # Since we reversed df, the latest row is now at the end.
    latest_row = df.iloc[-1]
    if PK_COL not in df.columns:
        raise RuntimeError(f"Primary key column '{PK_COL}' not found in Supabase result.")
    latest_pk = latest_row[PK_COL]
     
    # Build features
    df = add_datetime_features(df)

    # compute pred timestamp = latest timestamp + 1 hour
    latest_dt = pd.to_datetime(latest_row[TIME_COL], utc=True, errors="coerce")
    pred_dt = latest_dt + pd.Timedelta(hours=1)

    # ---------- windspeed prediction ----------
    df_ws = add_windspeed_lag_roll_features(df)
    ws_feature_cols = ws_bundle["feature_cols"]

    # pick the last row with complete features
    df_ws2 = df_ws.dropna(subset=ws_feature_cols).copy()
    if df_ws2.empty:
        raise RuntimeError("Not enough rows to compute windspeed lag/rolling features. Increase limit_rows.")
    last_ws = df_ws2.iloc[-1:][ws_feature_cols].to_numpy()

    rf = ws_bundle["rf"]
    xgb_model = ws_bundle["xgb"]
    w = ws_bundle.get("weights", {"rf": 0.5, "xgb": 0.5})
    w_rf, w_xgb = w["rf"], w["xgb"]

    ws_pred = (w_rf * rf.predict(last_ws)) + (w_xgb * xgb_model.predict(last_ws))
    ws_pred = float(ws_pred[0])

    # ---------- winddir prediction ----------
    df_wd = add_winddir_lag_roll_features(df)
    wd_feature_cols = wd_bundle["feature_cols"]

    df_wd2 = df_wd.dropna(subset=wd_feature_cols).copy()
    if df_wd2.empty:
        raise RuntimeError("Not enough rows to compute winddir lag/rolling features. Increase limit_rows.")
    last_wd = df_wd2.iloc[-1:][wd_feature_cols].to_numpy()

    rf_sin = wd_bundle["rf_sin"]
    rf_cos = wd_bundle["rf_cos"]
    xgb_sin = wd_bundle["xgb_sin"]
    xgb_cos = wd_bundle["xgb_cos"]

    # Your yearly script uses simple average ensemble
    sin_pred = (rf_sin.predict(last_wd) + xgb_sin.predict(last_wd)) / 2
    cos_pred = (rf_cos.predict(last_wd) + xgb_cos.predict(last_wd)) / 2

    sin_pred = float(sin_pred[0])
    cos_pred = float(cos_pred[0])

    # normalize (prevents weird angles if magnitude not 1)
    sin_pred, cos_pred = normalize_unit_circle(sin_pred, cos_pred)
    wd_pred = sincos_to_deg(sin_pred, cos_pred)

    # update latest row with predictions + prediction timestamp
    payload = {
        "pred_timestamp": pred_dt.isoformat(),
        "pred_windspeed": ws_pred,
        "pred_winddir": wd_pred,
    }

    supabase.table(TABLE).update(payload).eq(PK_COL, latest_pk).execute()

    return {"ok": True, "updated_id": int(latest_pk), **payload}


if __name__ == "__main__":
    print(predict_latest_and_update(limit_rows=80))



