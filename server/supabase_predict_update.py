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

def sincos_to_deg(sin_v: np.ndarray, cos_v: np.ndarray) -> np.ndarray:
    ang = np.degrees(np.arctan2(sin_v, cos_v))
    return (ang + 360) % 360


def normalize_unit_circle(sin_v: np.ndarray, cos_v: np.ndarray):
    mag = np.sqrt(sin_v**2 + cos_v**2)
    return sin_v / (mag + 1e-9), cos_v / (mag + 1e-9)

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

# ------------------ SUPABASE HELPERS ------------------
def fetch_rows(supabase, limit_rows: int):
    # Ascending by time so lags work correctly
    res = (
        supabase.table(TABLE)
        .select("*")
        .order(TIME_COL, desc=False)
        .limit(limit_rows)
        .execute()
    )
    rows = res.data or []
    if not rows:
        raise RuntimeError("No rows fetched from Supabase.")
    return pd.DataFrame(rows)


def update_rows(supabase, updates, batch_size: int = 200):
    for i in range(0, len(updates), batch_size):
        chunk = updates[i:i + batch_size]

        for row in chunk:
            pk_val = row[PK_COL]

            payload = {
                "pred_timestamp": row["pred_timestamp"],
                "pred_windspeed": row["pred_windspeed"],
                "pred_winddir": row["pred_winddir"],
            }

            supabase.table(TABLE).update(payload).eq(PK_COL, pk_val).execute()

        print(f"[OK] Updated {i+len(chunk)}/{len(updates)} rows")


#MAIN PIPELINE
def predict_missing_rows(limit_rows: int = 5000, upsert_batch: int = 200):
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Load model bundles
    ws_bundle = joblib.load(WINDSPEED_MODEL_PATH)
    wd_bundle = joblib.load(WINDDIR_MODEL_PATH)

    ws_feature_cols = ws_bundle["feature_cols"]
    wd_feature_cols = wd_bundle["feature_cols"]

    rf_ws = ws_bundle["rf"]
    xgb_ws = ws_bundle["xgb"]
    w_ws = ws_bundle.get("weights", {"rf": 0.5, "xgb": 0.5})
    w_rf_ws, w_xgb_ws = w_ws["rf"], w_ws["xgb"]

    rf_sin = wd_bundle["rf_sin"]
    rf_cos = wd_bundle["rf_cos"]
    xgb_sin = wd_bundle["xgb_sin"]
    xgb_cos = wd_bundle["xgb_cos"]

    # 1) Fetch rows
    df = fetch_rows(supabase, limit_rows=limit_rows)

    # Safety checks
    for col in [PK_COL, TIME_COL, "windspeed", "windgust", "winddir"]:
        if col not in df.columns:
            raise RuntimeError(f"Missing required column in table: {col}")

    # If these cols don't exist yet, create empty so .isna() works
    if "pred_windspeed" not in df.columns:
        df["pred_windspeed"] = np.nan
    if "pred_winddir" not in df.columns:
        df["pred_winddir"] = np.nan

    # 2) Build features
    df = add_datetime_features(df)
    df_ws = add_windspeed_lag_roll_features(df)
    df_wd = add_winddir_lag_roll_features(df)

    # 3) Decide which rows are eligible
    ws_ok = df_ws[ws_feature_cols].notna().all(axis=1)
    wd_ok = df_wd[wd_feature_cols].notna().all(axis=1)

    # only predict rows where at least one prediction is missing
    missing_pred = df["pred_windspeed"].isna() | df["pred_winddir"].isna()

    eligible = ws_ok & wd_ok & missing_pred
    idxs = df.index[eligible].tolist()

    if not idxs:
        return {"ok": True, "updated": 0, "message": "No missing predictions found."}

    # 4) Predict in one shot (vectorized)
    X_ws = df_ws.loc[idxs, ws_feature_cols].to_numpy()
    ws_pred = (w_rf_ws * rf_ws.predict(X_ws)) + (w_xgb_ws * xgb_ws.predict(X_ws))

    X_wd = df_wd.loc[idxs, wd_feature_cols].to_numpy()
    sin_pred = (rf_sin.predict(X_wd) + xgb_sin.predict(X_wd)) / 2
    cos_pred = (rf_cos.predict(X_wd) + xgb_cos.predict(X_wd)) / 2

    sin_pred, cos_pred = normalize_unit_circle(sin_pred, cos_pred)
    wd_pred = sincos_to_deg(sin_pred, cos_pred)

    # 5) Build update payloads
    updates = []
    for i, row_idx in enumerate(idxs):
        pk_val = df.loc[row_idx, PK_COL]

        ts_val = pd.to_datetime(df.loc[row_idx, TIME_COL], utc=True, errors="coerce")
        pred_ts = (ts_val + pd.Timedelta(hours=1)).isoformat() if pd.notna(ts_val) else None

        updates.append({
            PK_COL: int(pk_val),
            "pred_timestamp": pred_ts,
            "pred_windspeed": float(ws_pred[i]),
            "pred_winddir": float(wd_pred[i]),
        })

    # 6) Update rows
    update_rows(supabase, updates, batch_size=upsert_batch)

    return {"ok": True, "updated": len(updates)}


if __name__ == "__main__":
    print(predict_missing_rows(limit_rows=5000, upsert_batch=200))
