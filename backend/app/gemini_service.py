import os
import re
import json
from typing import Dict

# --- CORRECT IMPORTS for the 'google-genai' library ---
from google import genai
from google.genai.types import HttpOptions
from google.genai import Client

# This function must be defined or imported
def _ensure_env_loaded():
    """Loads environment variables from a .env file."""
    try:
        from dotenv import load_dotenv
        # Assuming .env is located correctly relative to where the server starts
        load_dotenv()
    except ImportError:
        print("Warning: python-dotenv not installed. Skipping .env load.")
        pass

def get_gemini_client():
    """Initializes and returns the configured Gemini Client (Synchronous)."""
    _ensure_env_loaded()
    
    # Authentication: The client will pick up GEMINI_API_KEY or GOOGLE_API_KEY from the environment
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") 
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY or GOOGLE_API_KEY environment variable is not set.")
    
    # We create and return the normal SYNC client
    # The documentation shows the new client object handles API access directly.
    client = Client(api_key=api_key) 
    return client

# --- Create a single global SYNC client ---
try:
    GEMINI_CLIENT = get_gemini_client()
except Exception as e:
    print(f"FATAL: Could not initialize Gemini Client: {e}")
    GEMINI_CLIENT = None


async def analyze_rorschach_response(patient_response: str, image_id: str) -> Dict[str, str]:
    """
    Uses Gemini to analyze a patient's Rorschach response.
    This uses the correct async pattern confirmed by the documentation.
    """
    if not GEMINI_CLIENT:
        return {"error": "Gemini client is not initialized."}

    # IMPORTANT: The prompt contains STRONG instructions for STRICT JSON output.
    # We rely on the model following these instructions, as the configuration 
    # was causing 400 errors.
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
        # --- CORRECT ASYNC CALL FROM DOCUMENTATION ---
        # 1. Use client.aio for the asynchronous implementation.
        # 2. Use the model name from the documentation: 'gemini-2.0-flash' (or a compatible version).
        response = await GEMINI_CLIENT.aio.models.generate_content(
            model='gemini-2.0-flash', # Correct model name to resolve 404 NOT_FOUND error.
            contents=prompt
            # Removed the problematic 'config' parameter to ensure the call works.
        )
        
        text = (getattr(response, "text", "") or "{}").strip()

        # Your robust JSON parsing logic handles the raw text output.
        try:
            return json.loads(text)
        except Exception:
            pass

        if text.startswith("```"):
            text = re.sub(r"^```[a-zA-Z0-9_-]*\n?|```$", "", text).strip()
            try:
                return json.loads(text)
            except Exception:
                pass

        try:
            start = text.find('{')
            end = text.rfind('}')
            if start != -1 and end != -1 and end > start:
                candidate = text[start:end+1]
                return json.loads(candidate)
        except Exception:
            pass

        # Final failure state, return an error
        print(f"Warning: Failed to parse final JSON from AI output. Raw output: {text[:100]}...")
        return {"error": "Failed to parse final JSON from AI output."}
        
    except Exception as e:
        print(f"Error calling Gemini API: {e}") 
        return {"error": f"Gemini API call failed: {str(e)}"}