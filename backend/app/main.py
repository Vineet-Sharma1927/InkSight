# Add these lines at the very top of your main.py file
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'), override=True)

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from pathlib import Path
import json
from datetime import datetime
import asyncio


from .db import (
    PatientModel,
    PatientResponse,
    PatientBasicInfo,
    ResponseEntry,
    ImageResponse,
    insert_patient,
    get_patient_by_id,
    get_all_patients,
    update_patient_responses,
    create_indexes,
    db
)

from .startup import check_mongodb_connection
from .gemini_service import analyze_rorschach_response # This import now happens AFTER load_dotenv


# Initialize FastAPI app
app = FastAPI(
    title="Psychological Test API",
    description="API for analyzing psychological test responses",
    version="1.0.0"
)

# ==============================================================================
# === MODIFIED SECTION START ===
# ==============================================================================

# This is the "guest list" of all the websites/apps allowed to talk to your API
origins = [
    # This is for your deployed website
    "https://ink-sight.vercel.app",

    # This is for your local web development server
    "http://localhost:3000",

    # --- ADDED LINES FOR YOUR MOBILE APP ---
    "https://localhost",        # For Capacitor iOS and the origin in your error
    "http://localhost",         # For Capacitor Android
    "capacitor://localhost",    # Another potential origin for Capacitor
]

# Add CORS middleware to allow requests from the frontend and mobile app
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Use the new, more complete list
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================================================================
# === MODIFIED SECTION END ===
# ==============================================================================


# Initialize the response analyzer
data_dir = Path(__file__).parent.parent / 'data'
data_dir.mkdir(exist_ok=True)

# Define request and response models
class AnalyzeRequest(BaseModel):
    response_text: str
    image_id: int



class AISuggestRequest(BaseModel):
    patient_response: str
    image_id: int
    patient_id: Optional[str] = None
    response_id: Optional[str] = None

class AISuggestResponse(BaseModel):
    suggestions: Dict[str, str]
    message: Optional[str] = None

class SaveScoresRequest(BaseModel):
    patient_id: str
    image_id: int
    response_id: str
    location: str
    determinants: str
    form_quality: str
    special_scores: str

class SummaryStatistics(BaseModel):
    total_responses: int
    location_totals: Dict[str, int]
    determinant_totals: Dict[str, int]
    content_totals: Dict[str, int]
    dq_totals: Dict[str, int]
    popular_responses: int

@app.on_event("startup")
async def startup_db_client():
    """
    Startup event to initialize database connection and indexes
    """

    print("==============================================")
    print("=== CHECKING ENVIRONMENT VARIABLES ON STARTUP ===")
    mongo_uri_from_env = os.getenv("MONGO_URI")
    mongo_db_from_env = os.getenv("MONGO_DB")
    print(f"MONGO_URI found: {mongo_uri_from_env is not None}")
    print(f"MONGO_DB found: {mongo_db_from_env is not None}")
    # For security, you might not want to print the full URI in logs
    # print(f"DEBUG: MONGO_URI = {mongo_uri_from_env}") 
    print(f"DEBUG: MONGO_DB = {mongo_db_from_env}")
    print("==============================================")
    print("Starting application initialization...")

    # Check MongoDB connection first
    connection_ok = await check_mongodb_connection()
    if not connection_ok:
        print("⚠️ Warning: MongoDB connection check failed, but continuing startup...")

    try:
        # Create indexes
        await create_indexes()

        print("✅ Application initialization complete!")
    except Exception as e:
        print(f"❌ Error during startup: {str(e)}")
        print("⚠️ Application will continue to run but may have limited functionality")

@app.get("/")
async def root():
    """Root endpoint to check if the API is running."""
    return {"message": "Psychological Test Response Analyzer API is running"}



@app.post("/ai/suggest", response_model=AISuggestResponse)
async def ai_suggest(request: AISuggestRequest):
    if not request.patient_response or not str(request.patient_response).strip():
        raise HTTPException(status_code=400, detail="Patient response cannot be empty")
    if request.image_id < 1 or request.image_id > 10:
        raise HTTPException(status_code=400, detail="Image ID must be between 1 and 10")

    # Call Gemini service
    suggestions = await analyze_rorschach_response(request.patient_response, str(request.image_id))
    if "error" in suggestions:
        # Return 502 to allow frontend to show a friendly error
        raise HTTPException(status_code=502, detail=f"Gemini error: {suggestions['error']}")

    # Optionally persist gemini_suggestions and mark status pending_review if patient_id/response_id provided
    if request.patient_id and request.response_id:
        try:
            # Find the matching response entry and update it
            # Note: Without a stable unique ID for each entry, this uses a broad array filter.
            # Consider adding a unique entry_id to ResponseEntry for precise updates.
            result = await db.patients.update_one(
                {
                    "patient_id": request.patient_id,
                    "responses.image_number": request.image_id,
                    # We do not have an ObjectId per entry; use arrayFilters with positional index based on response_id
                },
                {
                    "$set": {
                        "responses.$[img].entries.$[ent].gemini_suggestions": suggestions,
                        "responses.$[img].entries.$[ent].status": "pending_review",
                    }
                },
                array_filters=[
                    {"img.image_number": request.image_id},
                    {"ent.response_id": request.response_id} # Assuming response_id is unique per entry now
                    # You previously had {"ent.position": {"$exists": True}, "ent.response_text": {"$exists": True}}
                    # This is too generic. You need a unique identifier for 'ent' in the array_filters.
                    # If 'response_id' is indeed meant to be unique for each 'entry', use it here.
                ]
            )
        except Exception as e:
            # Do not block returning suggestions on DB update failure
            print(f"Failed to persist gemini_suggestions: {str(e)}")

    return AISuggestResponse(suggestions=suggestions, message="AI suggestions generated")

@app.post("/save-rorschach-scores", response_model=dict)
async def save_rorschach_scores(payload: SaveScoresRequest):
    try:
        # Update the final doctor scores and mark status completed
        update_result = await db.patients.update_one(
            {
                "patient_id": payload.patient_id,
                "responses.image_number": payload.image_id,
            },
            {
                "$set": {
                    "responses.$[img].entries.$[ent].location": payload.location,
                    "responses.$[img].entries.$[ent].determinants": payload.determinants.split(',') if payload.determinants else [], # Changed from '.' to ',' as special_scores often comma-separated
                    "responses.$[img].entries.$[ent].fq": payload.form_quality,
                    "responses.$[img].entries.$[ent].special_score": payload.special_scores.split(',') if payload.special_scores else [], # Changed from '.' to ','
                    "responses.$[img].entries.$[ent].status": "completed"
                }
            },
            array_filters=[
                {"img.image_number": payload.image_id},
                {"ent.response_id": payload.response_id} # Assuming response_id is unique per entry
            ]
        )
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient or response not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# MongoDB Patient Endpoints
@app.post("/submit-patient", response_model=dict)
async def submit_patient(patient: PatientModel):
    """
    Submit a new patient record with all responses.

    This endpoint processes all responses, analyzes them against the reference data,
    and stores the complete record in MongoDB.
    """
    # Process all responses to auto-fill location and fq
    for image_response in patient.responses:
        for entry in image_response.entries:
            if entry.response_text:
                result = analyzer.analyze_response(entry.response_text, image_response.image_number)
                if result:
                    entry.location = result["location"]
                    entry.fq = result["fq"]
            # Ensure response_id is generated if not already set (e.g., for new submissions)
            if not entry.response_id:
                # Generate a simple unique ID for each response entry if one doesn't exist
                # You might use UUID here, or a timestamp combined with a counter
                # For simplicity, let's assume `position` or `_id` from MongoDB for existing data,
                # or generate a UUID if a new entry.
                # For a new submission, `response_id` should probably be generated at the frontend or PatientModel creation.
                # For now, if it's missing, let's use a placeholder. Best to define in PatientModel if always required.
                entry.response_id = str(datetime.now().timestamp()) + "_" + str(image_response.image_number) + "_" + str(entry.position)


    # Convert Pydantic model to dict for MongoDB
    patient_dict = patient.dict(by_alias=True)

    # Insert into MongoDB
    try:
        inserted_id = await insert_patient(patient_dict)
        return {"success": True, "patient_id": patient.patient_id, "id": inserted_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting patient: {str(e)}")

@app.get("/patient/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str):
    """
    Retrieve a patient record by patient ID.

    Returns the complete patient record including all responses and auto-filled fields.
    """
    patient = await get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")

    # Convert MongoDB ObjectId to string
    patient["_id"] = str(patient["_id"])
    return patient

@app.get("/patients", response_model=List[PatientBasicInfo])
async def list_patients():
    """
    List all patients with basic information.

    Returns a list of all patients with ID, name, age, and date.
    """
    patients = await get_all_patients()

    # Convert MongoDB ObjectId to string
    for patient in patients:
        patient["_id"] = str(patient["_id"])

    return patients

@app.put("/patient/{patient_id}/responses", response_model=dict)
async def update_responses(patient_id: str, responses: List[ImageResponse]):
    """
    Update a patient's responses.

    This endpoint allows updating just the responses for a patient.
    """
    # Process all responses to auto-fill location and fq
    for image_response in responses:
        for entry in image_response.entries:
            if entry.response_text:
                result = analyzer.analyze_response(entry.response_text, image_response.image_number)
                if result:
                    entry.location = result["location"]
                    entry.fq = result["fq"]

    # Convert Pydantic models to dict for MongoDB
    responses_dict = []
    for resp in responses:
        responses_dict.append(json.loads(resp.json()))

    # Update in MongoDB
    success = await update_patient_responses(patient_id, responses_dict)
    if not success:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found or responses not updated")

    return {"success": True, "message": f"Responses updated for patient {patient_id}"}

@app.get("/patient/{patient_id}/summary-statistics", response_model=SummaryStatistics)
async def get_summary_statistics(patient_id: str):
    """
    Get summary statistics for a patient's responses.

    Calculates totals for Location, Determinants, Content, DQ, and Popular responses.
    """
    patient = await get_patient_by_id(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")

    # Initialize counters
    location_totals = {}
    determinant_totals = {}
    content_totals = {}
    dq_totals = {}
    popular_responses = 0
    total_responses = 0

    # Process all responses
    for image_response in patient.get('responses', []):
        for entry in image_response.get('entries', []):
            total_responses += 1

            # Count popular responses
            if entry.get('is_popular', False):
                popular_responses += 1

            # Count locations
            location = entry.get('location', '')
            if location:
                location_totals[location] = location_totals.get(location, 0) + 1

            # Count determinants
            determinants = entry.get('determinants', [])
            for det in determinants:
                determinant_totals[det] = determinant_totals.get(det, 0) + 1

            # Count content
            content = entry.get('content', [])
            for cont in content:
                content_totals[cont] = content_totals.get(cont, 0) + 1

            # Count DQ
            dq_value = entry.get('dq', '')
            if dq_value:
                dq_totals[dq_value] = dq_totals.get(dq_value, 0) + 1

    return SummaryStatistics(
        total_responses=total_responses,
        location_totals=location_totals,
        determinant_totals=determinant_totals,
        content_totals=content_totals,
        dq_totals=dq_totals,
        popular_responses=popular_responses
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)