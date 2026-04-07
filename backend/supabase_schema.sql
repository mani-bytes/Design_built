-- BiasLens AI: Supabase Database Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. Reports Table (Main summary)
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY, -- Unique report ID from backend
    created_at TIMESTAMPTZ DEFAULT NOW(),
    media_name TEXT NOT NULL,
    media_type TEXT NOT NULL, -- 'image' | 'video'
    bias_score FLOAT NOT NULL,
    representation_index FLOAT NOT NULL,
    avg_confidence FLOAT NOT NULL,
    model_version TEXT DEFAULT 'Gemini 1.5 Flash',
    gender_distribution JSONB DEFAULT '{}',
    role_distribution JSONB DEFAULT '{}',
    emotion_distribution JSONB DEFAULT '{}'
);

-- 2. Frames Table (Detailed detections per frame/image)
CREATE TABLE IF NOT EXISTS public.frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id TEXT REFERENCES public.reports(id) ON DELETE CASCADE,
    screen_id INT NOT NULL,
    timestamp TEXT, -- e.g., '00:10' for video
    gender TEXT NOT NULL,
    role TEXT NOT NULL,
    activity TEXT NOT NULL,
    emotion TEXT NOT NULL,
    confidence FLOAT NOT NULL,
    face_count INT NOT NULL,
    age_group TEXT NOT NULL,
    reasoning TEXT -- Detailed AI reasoning for the detection
);

-- Setup indexes for faster historical lookups
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_frames_report_id ON public.frames(report_id);
