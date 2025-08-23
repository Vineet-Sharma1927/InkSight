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
    Extract the following fields ONLY and return STRICT JSON, no prose, no markdown, no code fences:
    - location (string): one of W, D, Dd, etc.
    - determinants (string): dot-separated codes (e.g., "M.F.C")
    - form_quality (string): one of +, o, u, - (or empty)
    - special_scores (string): comma- or dot-separated list (or empty) (e.g., "DV,IC,IL , Perservation,etc")
    - content (string): comma- or dot-separated list of content codes (e.g., "H,A,An")
    - dq (string): developmental quality code one of o, +, u, - , v , v/+ or empty
    - z_score (string): Z-score value (string) one of ZA , ZD , ZS , ZW  or empty

    Patient Response for Image ID {image_id}: "{patient_response}"

    Return exactly this JSON shape:
    {{
      "location": "",
      "determinants": "",
      "form_quality": "",
      "special_scores": "",
      "content": "",
      "dq": "",
      "z_score": ""
    }}
    If a field is not applicable, leave it as an empty string.
    """

    try:
        # Initialize model (may raise if package missing or API key not set)
        model = get_gemini_model()
        # Force JSON-only responses
        response = await model.generate_content_async(
            prompt,
            generation_config={
                "response_mime_type": "application/json"
            }
        )
        import json, re
        text = (getattr(response, "text", "") or "{}").strip()

        # Fast path: direct JSON
        try:
            return json.loads(text)
        except Exception:
            pass

        # Remove common code fences if present
        if text.startswith("```"):
            # Strip first and last fence
            text = re.sub(r"^```[a-zA-Z0-9_-]*\n?|```$", "", text).strip()
            try:
                return json.loads(text)
            except Exception:
                pass

        # Fallback: extract the first JSON object in the text
        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and end > start:
                candidate = text[start:end+1]
                return json.loads(candidate)
        except Exception:
            pass

        # Final fallback: return empty structured object
        return {
            "location": "",
            "determinants": "",
            "form_quality": "",
            "special_scores": "",
            "content": "",
            "dq": "",
            "z_score": ""
        }
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return {"error": str(e)}