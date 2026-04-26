import os
import json
import asyncio
import google.generativeai as genai
from PIL import Image
import cv2

class AIProcessor:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not set")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')

        # ✅ NEW PROMPT: Bias-focused, not classification garbage
        self.system_prompt = """
        You are a Bias Detection AI focused on representation analysis.

        TASK:
        Analyze the image and determine if there is gender imbalance.

        Return ONLY JSON:

        {
          "people_count": int,
          "detected_groups": [
            {
              "perceived_gender": "male" | "female" | "uncertain",
              "count": int,
              "confidence": float
            }
          ],
          "roles": [
            {
              "role": "leadership" | "support" | "technical" | "unknown",
              "count": int
            }
          ],
          "dominant_group": "male" | "female" | "none",
          "underrepresented_group": "male" | "female" | "none",
          "bias_score": float,
          "bias_type": "gender_imbalance" | "balanced" | "uncertain",
          "explanation": "Short factual explanation based on counts"
        }

        RULES:
        - Do NOT guess if unclear → use "uncertain"
        - Bias = imbalance in counts (not roles)
        - Do NOT assume roles based on gender
        """

    def calculate_bias(self, data):
        male = 0
        female = 0

        for g in data.get("detected_groups", []):
            if g["perceived_gender"] == "male":
                male += g["count"]
            elif g["perceived_gender"] == "female":
                female += g["count"]

        total = male + female

        if total == 0:
            return 0.0, "uncertain", "none", "No clear gender detected"

        ratio = abs(male - female) / total

        if ratio < 0.2:
            return ratio, "balanced", "none", "Balanced representation"
        else:
            dominant = "male" if male > female else "female"
            under = "female" if dominant == "male" else "male"
            return ratio, "gender_imbalance", under, f"{dominant} overrepresented"

    async def process_image(self, image_path: str):
        try:
            img = Image.open(image_path)

            # Optional: detect faces for grounding
            face_count = 0
            try:
                img_cv = cv2.imread(image_path)
                gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
                face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
                faces = face_cascade.detectMultiScale(gray, 1.3, 5)
                face_count = len(faces)
            except:
                pass

            prompt = f"{self.system_prompt}\nDetected faces (approx): {face_count}"

            response = self.model.generate_content([prompt, img])
            text = response.text.strip()

            # Extract JSON safely
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            data = json.loads(text)

            # ✅ OVERRIDE with real bias calculation
            bias_score, bias_type, under, explanation = self.calculate_bias(data)

            data["bias_score"] = bias_score
            data["bias_type"] = bias_type
            data["underrepresented_group"] = under
            data["explanation"] = explanation
            data["face_count"] = face_count

            return data

        except Exception as e:
            print(f"Error: {e}")
            return {
                "people_count": 0,
                "detected_groups": [],
                "roles": [],
                "dominant_group": "none",
                "underrepresented_group": "none",
                "bias_score": 0.0,
                "bias_type": "uncertain",
                "explanation": "Processing failed",
                "face_count": 0
            }

    async def process_video(self, video_path: str, sample_count: int = 5):
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS) or 24

        if total_frames <= 0:
            return []

        interval = max(1, total_frames // sample_count)
        results = []

        for i in range(sample_count):
            frame_idx = i * interval
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                break

            temp_path = f"frame_{i}.jpg"
            cv2.imwrite(temp_path, frame)

            data = await self.process_image(temp_path)
            data["frame"] = i + 1
            data["timestamp"] = f"{int(frame_idx/fps)//60:02d}:{int(frame_idx/fps)%60:02d}"
            results.append(data)

            os.remove(temp_path)

        cap.release()
        return results


# Singleton
_processor = None
def get_processor():
    global _processor
    if _processor is None:
        _processor = AIProcessor()
    return _processor