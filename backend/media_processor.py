import os
import json
import asyncio
import google.generativeai as genai
from pathlib import Path
from PIL import Image
import cv2
import time

class AIProcessor:
    def __init__(self):
        # Read API key from environment
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key or "YOUR_GEMINI_API_KEY_HERE" in api_key:
            print("CRITICAL: GOOGLE_API_KEY is not set correctly in .env")
        
        genai.configure(api_key=api_key)
        # Use a currently supported multimodal model.
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')
        
        self.system_prompt = """
        You are a high-precision Multimodal Bias Detection AI. 
        Your goal is to provide 100% objective classification of gender, roles, and activities.
        
        PHASE 1: VISUAL DESCRIPTION (Chain of Thought)
        Describe the scene in 1 sentence. Mentions the people you see, their clothing (e.g., lab coat, suit), and the setting (e.g., doctor's office, meeting room).
        
        PHASE 2: CLASSIFICATION
        Identify the most prominent person or the overall distribution.
        
        STRICT GENDER RULES:
        1. If NO men are visible, gender is "female".
        2. If NO women are visible, gender is "male".
        3. If it's a mixed group, gender is "multiple".
        4. NEVER guess gender based on profession stereotypes (e.g., do not assume a doctor is male).
        
        STRICT ROLE RULES:
        - leadership: Leading, presenting, or dominant in the scene.
        - technical: Professional skills (e.g., doctor, engineer, analyst).
        - management: Overseeing, organizing.
        - support: Assisting, listening, or patient role.
        - creative: Artistic or creative work.

        Return ONLY a JSON object with this schema:
        {
          "reasoning": "A 1-sentence visual description (e.g., 'A female doctor in a white coat examining a female patient')",
          "gender": "male" | "female" | "multiple" | "unspecified",
          "role": "leadership" | "support" | "technical" | "management" | "creative",
          "activity": "presentation" | "discussion" | "analysis" | "collaboration" | "decision-making",
          "emotion": "confident" | "focused" | "engaged" | "neutral" | "enthusiastic",
          "confidence": float (0.0 to 1.0),
          "face_count": int,
          "age_group": "18-25" | "26-35" | "36-45" | "46+"
        }
        Do not include any text outside the JSON.
        """

    async def process_image(self, image_path: str):
        """Analyze image with strict visual verification."""
        try:
            img = Image.open(image_path)
            
            # Request content from Gemini
            response = self.model.generate_content([self.system_prompt, img])
            text = response.text
            
            # Robust JSON extraction
            print(f"DEBUG: Gemini raw response: {text[:200]}...")
            
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            
            # Log the reasoning for the user to see in backend console
            print(f"DEBUG: Reasoning: {data.get('reasoning')}")
            print(f"DEBUG: Detected Gender: {data.get('gender')}")
            
            return data
        except Exception as e:
            print(f"AI Processor Error: {e}")
            # Non-biased fallback
            return {
                "reasoning": "AI Processing Failed or Safety Triggered",
                "gender": "unspecified",
                "role": "unspecified",
                "activity": "unspecified",
                "emotion": "neutral",
                "confidence": 0.0,
                "face_count": 0,
                "age_group": "unknown"
            }

    async def process_video(self, video_path: str, sample_count: int = 5):
        """Analyze video with multi-frame sampling."""
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 24
        
        if total_frames <= 0: return []
        
        interval = max(1, total_frames // sample_count)
        frames_data = []
        
        for i in range(sample_count):
            frame_idx = i * interval
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret: break
            
            temp_path = f"uploads/frame_{i}.jpg"
            cv2.imwrite(temp_path, frame)
            
            try:
                data = await self.process_image(temp_path)
                data["screen_id"] = i + 1
                data["timestamp"] = f"{int(frame_idx/fps)//60:02d}:{int(frame_idx/fps)%60:02d}"
                frames_data.append(data)
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        cap.release()
        return frames_data

_processor = None
def get_processor():
    global _processor
    if _processor is None:
        _processor = AIProcessor()
    return _processor
