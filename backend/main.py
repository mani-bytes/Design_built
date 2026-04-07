"""
BiasLens AI – Definitive High-Accuracy Backend
Multimodal Bias Detection & Reporting System - Strict Logic v2
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import uuid
import json
import random
import time
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import os
import httpx
from supabase import create_client, Client
from media_processor import get_processor

# Load environment variables
load_dotenv()

# Supabase Setup
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Local Storage setup
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# In-memory store for active uploads (volatile)
uploads_store = {} # {upload_id: {"path": Path, "type": str, "filename": str}}

app = FastAPI(
    title="BiasLens AI – Multimodal Bias Detection API",
    description="REST API for gender bias detection, role classification, activity recognition, and fairness metrics.",
    version="1.2.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class Frame(BaseModel):
    screen_id: int
    timestamp: Optional[str] = None
    gender: str
    role: str
    activity: str
    emotion: str
    confidence: float
    face_count: int
    age_group: str
    reasoning: Optional[str] = None # Why the AI picked this

class BiasReport(BaseModel):
    id: str
    created_at: str
    media_name: str
    media_type: str
    frames: List[Frame]
    bias_score: float
    representation_index: float
    avg_confidence: float
    gender_distribution: dict
    role_distribution: dict
    emotion_distribution: dict
    model_version: str = "Gemini 1.5 Flash (Strict Logic v2)"

class AnalyzeRequest(BaseModel):
    upload_id: str
    media_type: str 

class URLAnalyzeRequest(BaseModel):
    url: str
    media_type: str

# ──────────────────────────────────────────────
# Metrics Engine
# ──────────────────────────────────────────────

def compute_metrics(frames: list):
    total = len(frames)
    if total == 0:
        return {
            "bias_score": 0.0, "representation_index": 0.0, "avg_confidence": 0.0,
            "gender_distribution": {}, "role_distribution": {}, "emotion_distribution": {},
        }

    gender_dist = {}
    role_dist = {}
    emotion_dist = {}

    for f in frames:
        g = f.get("gender", "unknown")
        gender_dist[g] = gender_dist.get(g, 0) + 1
        
        r = f.get("role", "unspecified")
        role_dist[r] = role_dist.get(r, 0) + 1
        
        e = f.get("emotion", "neutral")
        emotion_dist[e] = emotion_dist.get(e, 0) + 1

    # Bias score (based on male-female ratio if both exist)
    male_count = gender_dist.get("male", 0)
    female_count = gender_dist.get("female", 0)
    
    male_pct = male_count / total
    female_pct = female_count / total
    bias_score = round(abs(male_pct - female_pct), 2)

    # Representation (well represented if score < 0.2)
    representation_index = round(1.0 - bias_score, 2)
    avg_confidence = round(sum(f.get("confidence", 0) for f in frames) / total, 2)

    return {
        "bias_score": bias_score,
        "representation_index": representation_index,
        "avg_confidence": avg_confidence,
        "gender_distribution": gender_dist,
        "role_distribution": role_dist,
        "emotion_distribution": emotion_dist,
    }

# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.get("/", summary="Health check")
def root():
    return {"status": "ok", "service": "BiasLens AI Definitive API", "version": "1.2.0"}

@app.post("/upload", summary="Upload media file")
async def upload_media(file: UploadFile = File(...)):
    """Accept image or video upload and save it."""
    upload_id = str(uuid.uuid4())
    media_type = "video" if "video" in file.content_type else "image"
    
    file_extension = Path(file.filename).suffix
    file_path = UPLOAD_DIR / f"{upload_id}{file_extension}"
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    uploads_store[upload_id] = {
        "path": file_path,
        "media_type": media_type,
        "filename": file.filename
    }

    return {
        "upload_id": upload_id,
        "filename": file.filename,
        "media_type": media_type,
        "size": len(content),
    }

@app.post("/analyze", summary="Analyze uploaded media", response_model=BiasReport)
async def analyze_media(req: AnalyzeRequest):
    """Run strict multimodal AI inference and save to Supabase."""
    if req.upload_id not in uploads_store:
        raise HTTPException(404, "Upload ID not found. Please upload again.")
    
    upload_data = uploads_store[req.upload_id]
    file_path = str(upload_data["path"])
    
    processor = get_processor()
    
    try:
        if upload_data["media_type"] == "video":
            frames = await processor.process_video(file_path)
        else:
            data = await processor.process_image(file_path)
            data["screen_id"] = 1
            frames = [data]
    except Exception as e:
        raise HTTPException(500, f"AI Processing failed: {str(e)}")

    metrics = compute_metrics(frames)
    report_id = f"report_{uuid.uuid4().hex[:10]}"

    # 1. Insert Report into Supabase
    report_data = {
        "id": report_id,
        "created_at": datetime.utcnow().isoformat(),
        "media_name": upload_data["filename"],
        "media_type": req.media_type,
        **metrics
    }
    supabase.table("reports").insert(report_data).execute()

    # 2. Insert Frames into Supabase
    for f in frames:
        frame_entry = {
            "report_id": report_id,
            "screen_id": f["screen_id"],
            "timestamp": f.get("timestamp"),
            "gender": f["gender"],
            "role": f["role"],
            "activity": f["activity"],
            "emotion": f["emotion"],
            "confidence": f["confidence"],
            "face_count": f["face_count"],
            "age_group": f["age_group"],
            "reasoning": f.get("reasoning")
        }
        supabase.table("frames").insert(frame_entry).execute()

    return {**report_data, "frames": frames}

@app.post("/analyze/url", summary="Analyze media from URL")
async def analyze_url(req: URLAnalyzeRequest):
    """Download from URL and save analysis to Supabase."""
    upload_id = str(uuid.uuid4())
    file_extension = Path(req.url.split("?")[0]).suffix or (".mp4" if req.media_type == "video" else ".jpg")
    file_path = UPLOAD_DIR / f"{upload_id}{file_extension}"
    
    try:
        async with httpx.AsyncClient(follow_redirects=True) as client:
            resp = await client.get(req.url, timeout=30.0)
            resp.raise_for_status()
            with open(file_path, "wb") as buffer:
                buffer.write(resp.content)
    except Exception as e:
        raise HTTPException(400, f"Download failed: {str(e)}")

    processor = get_processor()
    try:
        if req.media_type == "video":
            frames = await processor.process_video(str(file_path))
        else:
            data = await processor.process_image(str(file_path))
            data["screen_id"] = 1
            frames = [data]
    except Exception as e:
        raise HTTPException(500, f"AI Processing failed: {str(e)}")

    metrics = compute_metrics(frames)
    report_id = f"report_{uuid.uuid4().hex[:10]}"

    report_data = {
        "id": report_id,
        "created_at": datetime.utcnow().isoformat(),
        "media_name": req.url,
        "media_type": req.media_type,
        **metrics
    }
    supabase.table("reports").insert(report_data).execute()

    for f in frames:
        frame_entry = {
            "report_id": report_id,
            "screen_id": f["screen_id"],
            "timestamp": f.get("timestamp"),
            "gender": f["gender"],
            "role": f["role"],
            "activity": f["activity"],
            "emotion": f["emotion"],
            "confidence": f["confidence"],
            "face_count": f["face_count"],
            "age_group": f["age_group"],
            "reasoning": f.get("reasoning")
        }
        supabase.table("frames").insert(frame_entry).execute()

    return {**report_data, "frames": frames}

@app.get("/report/{report_id}", summary="Get report by ID")
def get_report(report_id: str):
    """Fetch report and associated frames from Supabase."""
    report_res = supabase.table("reports").select("*").eq("id", report_id).execute()
    if not report_res.data:
        raise HTTPException(404, "Report not found")
    
    frames_res = supabase.table("frames").select("*").eq("report_id", report_id).order("screen_id").execute()
    
    return {**report_res.data[0], "frames": frames_res.data}

@app.get("/history", summary="Get analysis history")
def get_history():
    """Fetch recent reports from Supabase."""
    res = supabase.table("reports").select("*").order("created_at", desc=True).limit(50).execute()
    return {"count": len(res.data), "reports": res.data}

@app.delete("/report/{report_id}", summary="Delete a report")
def delete_report(report_id: str):
    if report_id not in reports_store:
        raise HTTPException(404, "Report not found")
    del reports_store[report_id]
    save_db(reports_store)
    return {"message": "Deleted", "id": report_id}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
