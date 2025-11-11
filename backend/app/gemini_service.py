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
You are an expert Rorschach Inkblot Test scorer using the Comprehensive System. Analyze the patient's response to Image ID "{image_id}" and provide complete scoring codes.

PATIENT RESPONSE: "{patient_response}"

REQUIRED SCORING CODES (You MUST provide a value for EVERY field):

1. LOCATION - Where the response is seen (REQUIRED - select ONE):
   - W (Whole blot)
   - D (Common detail)
   - Dd (Unusual detail)
   - S (White space)
   Default to "W" if unclear.

2. DETERMINANTS - What features determine the response (REQUIRED - use dots to separate multiple):
   Form: F (pure form)
   Movement: M (human), FM (animal), m (inanimate)
   Color: C (pure color), CF (color-form), FC (form-color), Cn (color naming)
   Shading: T (texture), V (vista), Y (diffuse shading)
   Pairs/Reflections: (2) (pair), Fr/rF (reflection)
   Default to "F" if unclear.

3. FORM_QUALITY - Quality of the form (REQUIRED - select ONE):
   - + (superior)
   - o (ordinary)
   - u (unusual)
   - - (minus/poor)
   Default to "o" if unclear.

4. CONTENT - What is seen (REQUIRED - comma-separated):
   H (human), A (animal), An (anatomy), Art (art), Ay (anthropology), Bl (blood), 
   Bt (botany), Cg (clothing), Cl (clouds), Ex (explosion), Fi (fire), Fd (food),
   Ge (geography), Hh (household), Ls (landscape), Na (nature), Sc (science), Sx (sex)
   Provide at least one content code. Default to "A" if unclear.

5. DEVELOPMENTAL_QUALITY (DQ) - Synthesis quality (REQUIRED - select ONE):
   - + (synthesized)
   - o (ordinary)
   - v/+ (synthesized vague)
   - v (vague)
   Default to "o" for simple responses or "+" if integration is evident.

6. Z_SCORE - Organizational activity (REQUIRED when applicable):
   - ZW (whole response with integration)
   - ZA (adjacent detail integration)
   - ZD (distant detail integration)
   - ZS (white space integration)
   Provide "ZW" if whole blot is used with any integration, otherwise leave empty.

7. SPECIAL_SCORES - Cognitive/perceptual issues (comma-separated if present):
   DV (deviant verbalization), DR (deviant response), INC (incongruous), FAB (fabulized),
   ALOG (autistic logic), CON (contamination), PSV (perseveration), AG (aggressive),
   MOR (morbid), PER (personalized), CP (color projection)
   Provide "MOR" if blood/death/injury mentioned, otherwise leave empty if none apply.

CRITICAL: Return ONLY valid JSON with ALL fields filled. No explanations, no markdown, no code blocks.

{{
  "location": "",
  "determinants": "",
  "form_quality": "",
  "content": "",
  "dq": "",
  "z_score": "",
  "special_scores": ""
}}

EXAMPLE for "blood all over the body":
{{
  "location": "W",
  "determinants": "C.F",
  "form_quality": "u",
  "content": "Bl,An",
  "dq": "o",
  "z_score": "ZW",
  "special_scores": "MOR"
}}
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