# backend/app/gemini_service.py
import os
from pathlib import Path
from typing import Dict

try:
    from dotenv import load_dotenv
except Exception:
    load_dotenv = None

def _ensure_env_loaded() -> None:
    """Load environment variables from backend/.env.local if available."""
    if load_dotenv is None:
        return
    backend_root = Path(__file__).resolve().parents[1]
    env_path = backend_root / ".env.local"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path)


def get_gemini_model():
    """Initializes and returns the Gemini Pro model."""
    _ensure_env_loaded()
    try:
        import google.generativeai as genai
    except Exception as e:
        raise RuntimeError("google-generativeai is not installed. Please install it in the backend environment.") from e
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set. Create backend/.env.local or set the environment variable.")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash-latest')

async def analyze_rorschach_response(patient_response: str, image_id: str) -> Dict[str, str]:
    """
    Uses Gemini to analyze a patient's Rorschach response and extract scoring fields.
    """
    model = get_gemini_model()

    # Construct the prompt for Gemini. This is critical for good results.
    # You'll need to refine this prompt heavily through experimentation.
    # Provide examples if possible to make the model understand the context better.
    prompt = f"""
    You are an expert Rorschach test scorer. Analyze the following patient response for Rorschach Inkblot Image ID "{image_id}".
    Extract the following standard Rorschach scoring fields:
    - **Location (L)**: The area of the blot used (e.g., Whole (W), Common Detail (D), Unusual Detail (Dd)).
    - **Determinants (D)**: Qualities of the blot that influenced the response (e.g., Form (F), Movement (M), Color (C), Shading (Y, T, V)).
    - **Form Quality (FQ)**: How accurately the response fits the shape of the blot (e.g., Ordinary (+), Ordinary (o), Unusual (u), Minus (-)).
    - **Special Scores (SS)**: Any unusual or significant features of the response (e.g., DV, DR, FABCOM, PEC, CON).

    Patient Response for Image ID {image_id}: "{patient_response}"

    Provide the output as a JSON object with keys: "location", "determinants", "form_quality", "special_scores".
    For example:
    {{
      "location": "W",
      "determinants": "M.F.C",
      "form_quality": "o",
      "special_scores": "FABCOM"
    }}
    If a field is not applicable or cannot be determined, use an empty string or "N/A".
    """

    try:
        # Initialize model (may raise if package missing or API key not set)
        model = get_gemini_model()
        response = await model.generate_content_async(prompt)
        import json
        text = getattr(response, "text", "") or "{}"
        return json.loads(text.strip())
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {"error": str(e)}