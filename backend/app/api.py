# backend/app/api.py (Example modification)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from .gemini_service import analyze_rorschach_response
from .db import get_database_connection # Assuming you have this for saving results

router = APIRouter()

class RorschachAnalysisRequest(BaseModel):
    patient_response: str
    image_id: str
    response_id: str # Assuming you have an ID for each patient response

@router.post("/analyze-response")
async def analyze_response_with_gemini(request: RorschachAnalysisRequest):
    """
    Endpoint to send patient response to Gemini for automated scoring.
    """
    try:
        # Call the Gemini service
        gemini_output = await analyze_rorschach_response(
            request.patient_response,
            request.image_id
        )

        if "error" in gemini_output:
            raise HTTPException(status_code=500, detail=gemini_output["error"])

        # Optionally, save this provisional output to your database
        # This allows the doctor to retrieve and modify it.
        # You'll need a new collection/field in your existing responses schema
        # to store this 'gemini_suggestions'.

        db = get_database_connection() # Get your DB connection
        # Update the specific response in the database with Gemini's suggestions
        # Example:
        await db.responses.update_one(
            {"_id": request.response_id}, # Assuming _id is your response ID
            {"$set": {"gemini_suggestions": gemini_output, "status": "pending_review"}}
        )

        return {"message": "Analysis requested successfully", "suggestions": gemini_output}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")