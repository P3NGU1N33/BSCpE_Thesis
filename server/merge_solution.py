import os
import glob
import pandas as pd

INPUT_FOLDER = "input"
OUTPUT_FILE = "output/2026.csv"

REQUIRED_COLUMNS = [
    "datetime",
    "temp",
    "humidity",
    "precip",
    "windgust",
    "windspeed",
    "winddir",
    "sealevelpressure",
    "cloudcover",
    "visibility",
]

def merge_csvs_keep_latest(input_folder: str, output_file: str):
    os.makedirs(os.path.dirname(output_file), exist_ok=True)

    csv_files = sorted(glob.glob(os.path.join(input_folder, "*.csv")))
    if not csv_files:
        print(f"No CSV files found in: {input_folder}")
        return

    all_dfs = []

    for i, file in enumerate(csv_files, start=1):
        print(f"Reading: {file}")
        df = pd.read_csv(file)

        if "datetime" not in df.columns:
            raise ValueError(f"'datetime' column not found in {file}")

        # Add missing columns if not present
        for col in REQUIRED_COLUMNS:
            if col not in df.columns:
                df[col] = pd.NA

        df = df[REQUIRED_COLUMNS].copy()

        # FIX: make all datetimes uniform
        df["datetime"] = pd.to_datetime(df["datetime"], errors="coerce", utc=True)
        df["datetime"] = df["datetime"].dt.tz_localize(None)

        # Optional: if your data is hourly and you want to normalize to exact hour
        # df["datetime"] = df["datetime"].dt.floor("h")

        df = df.dropna(subset=["datetime"]).copy()
        df["_file_order"] = i

        all_dfs.append(df)

    merged = pd.concat(all_dfs, ignore_index=True)

    # Sort so later files overwrite earlier files
    merged = merged.sort_values(["datetime", "_file_order"]).reset_index(drop=True)

    # Keep latest row for duplicate datetime
    merged = merged.drop_duplicates(subset=["datetime"], keep="last")

    # Final sort by datetime
    merged = merged.sort_values("datetime").reset_index(drop=True)

    # Remove helper column
    merged = merged.drop(columns=["_file_order"])

    merged.to_csv(output_file, index=False)
    print(f"Saved merged CSV to {output_file}")
    print(f"Rows: {len(merged)}")


if __name__ == "__main__":
    merge_csvs_keep_latest(INPUT_FOLDER, OUTPUT_FILE)