from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from supabase import create_client
from supabase_predict_update import predict_missing_rows
# import asyncio



load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
TABLE = os.getenv("SUPABASE_TABLE", "iswai_data")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# @app.on_event("startup")
# async def startup_predict():
#     asyncio.create_task(asyncio.to_thread(
#         predict_missing_rows,
#         limit_rows=5000,
#         upsert_batch=200
#     ))

@app.get("/history")
def history(limit: int = 200, order: str = "desc"):
    # order by datetime
    q = supabase.table(TABLE).select(
        "id,timestamp,windspeed,pred_windspeed,winddir,pred_winddir"
    )
    q = q.order("timestamp", desc=(order == "desc")).limit(limit)
    res = q.execute()
    return {"rows": res.data or []}

@app.post("/predict/latest")
def predict_latest():
    return predict_missing_rows(limit_rows=5000, upsert_batch=200)

    