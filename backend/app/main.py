# main.py

from dotenv import load_dotenv
import os
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env.local'), override=True)

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import json
from motor.motor_asyncio import AsyncIOMotorClient # Add this import

# --- Refactored Imports from .db ---
from .db import (
    PatientModel,
    PatientResponse,
    PatientBasicInfo,
    insert_patient,
    get_patient_by_id,
    get_all_patients,
    update_patient_responses,
    delete_patient,
    connect_to_mongo,
    close_mongo_connection,
    get_database
)
from .gemini_service import analyze_rorschach_response

# Initialize FastAPI app
app = FastAPI(
    title="Psychological Test API",
    description="API for analyzing psychological test responses",
    version="1.0.0"
)

# --- New Lifecycle Events ---
@app.on_event("startup")
async def startup_event():
    print("Application startup...")
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutdown...")
    await close_mongo_connection()

# --- CORS Middleware (Keep as is) ---
origins = [
    "https://ink-sight.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001",
    "https://localhost",
    "http://localhost",
    "capacitor://localhost",
    "https://app",  # Capacitor iOS
    "http://app",   # Capacitor Android
    "capacitor://app",
    "ionic://localhost",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# --- Request/Response Models (Keep as is) ---
# ... (AnalyzeRequest, AISuggestRequest, etc. remain here) ...
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
    form_quality: Dict[str, Any]
    special_scores: Dict[str, int]


# --- Refactored API Endpoints ---
# Every endpoint that interacts with the database now has `db: AsyncIOMotorClient = Depends(get_database)`

@app.get("/")
async def root():
    return {"message": "Psychological Test Response Analyzer API is running"}

@app.post("/ai/suggest", response_model=AISuggestResponse)
async def ai_suggest(request: AISuggestRequest, db: AsyncIOMotorClient = Depends(get_database)):
    if not request.patient_response or not str(request.patient_response).strip():
        raise HTTPException(status_code=400, detail="Patient response cannot be empty")
    
    suggestions = await analyze_rorschach_response(request.patient_response, str(request.image_id))
    if "error" in suggestions:
        raise HTTPException(status_code=502, detail=f"Gemini error: {suggestions['error']}")

    if request.patient_id and request.response_id:
        try:
            await db.patients.update_one(
                {"patient_id": request.patient_id},
                {"$set": {
                    "responses.$[img].entries.$[ent].gemini_suggestions": suggestions,
                    "responses.$[img].entries.$[ent].status": "pending_review",
                }},
                array_filters=[
                    {"img.image_number": request.image_id},
                    {"ent.response_id": request.response_id}
                ]
            )
        except Exception as e:
            print(f"Failed to persist gemini_suggestions: {e}")
            
    return AISuggestResponse(suggestions=suggestions, message="AI suggestions generated")

@app.post("/save-rorschach-scores", response_model=dict)
async def save_rorschach_scores(payload: SaveScoresRequest, db: AsyncIOMotorClient = Depends(get_database)):
    try:
        update_result = await db.patients.update_one(
            {"patient_id": payload.patient_id},
            {"$set": {
                "responses.$[img].entries.$[ent].location": payload.location,
                "responses.$[img].entries.$[ent].determinants": payload.determinants.split(',') if payload.determinants else [],
                "responses.$[img].entries.$[ent].fq": payload.form_quality,
                "responses.$[img].entries.$[ent].special_score": payload.special_scores.split(',') if payload.special_scores else [],
                "responses.$[img].entries.$[ent].status": "completed"
            }},
            array_filters=[
                {"img.image_number": payload.image_id},
                {"ent.response_id": payload.response_id}
            ]
        )
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Patient or response not found")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit-patient", response_model=dict)
async def submit_patient(patient: PatientModel, db: AsyncIOMotorClient = Depends(get_database)):
    # Note: The `analyzer` logic needs to be defined or imported. Assuming it's available.
    # for image_response in patient.responses:
    #     for entry in image_response.entries:
    #         if entry.response_text:
    #             result = analyzer.analyze_response(entry.response_text, image_response.image_number)
    #             # ...
    
    patient_dict = patient.model_dump(by_alias=True, exclude=["id"])
    try:
        inserted_id = await insert_patient(db, patient_dict)
        return {"success": True, "patient_id": patient.patient_id, "id": inserted_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error inserting patient: {e}")

@app.get("/patient/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, db: AsyncIOMotorClient = Depends(get_database)):
    patient = await get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")
    return PatientResponse(**patient)

@app.get("/patients", response_model=List[PatientBasicInfo])
async def list_patients(db: AsyncIOMotorClient = Depends(get_database)):
    patients_data = await get_all_patients(db)
    return [PatientBasicInfo(**p) for p in patients_data]

@app.put("/patient/{patient_id}/responses", response_model=dict)
async def update_responses(patient_id: str, responses: List[dict], db: AsyncIOMotorClient = Depends(get_database)):
    # Note: `analyzer` logic here too.
    success = await update_patient_responses(db, patient_id, responses)
    if not success:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found or not updated")
    return {"success": True, "message": f"Responses updated for patient {patient_id}"}

@app.get("/patient/{patient_id}/summary-statistics", response_model=SummaryStatistics)
async def get_summary_statistics(patient_id: str, db: AsyncIOMotorClient = Depends(get_database)):
    patient = await get_patient_by_id(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found")
    
    # Initialize counters for all possible fields
    location_totals, determinant_totals, content_totals, dq_totals = {}, {}, {}, {}
    special_score_totals = {}
    fq_totals = {'o': 0, '+': 0, 'u': 0, '-': 0}
    location_fq_counts = {'W': {'o': 0, '+': 0, 'u': 0, '-': 0}, 
                          'D': {'o': 0, '+': 0, 'u': 0, '-': 0},
                          'Dd': {'o': 0, '+': 0, 'u': 0, '-': 0},
                          'S': {'o': 0, '+': 0, 'u': 0, '-': 0}}
    popular_responses, total_responses = 0, 0
    
    # Iterate through all responses
    for image_response in patient.get('responses', []):
        for entry in image_response.get('entries', []):
            total_responses += 1
            
            # Count location
            location = entry.get('location', '')
            if location:
                # Normalize D1-D10 to just 'D' for counting
                normalized_location = location
                if location.startswith('D') and len(location) > 1 and location[1:].isdigit():
                    normalized_location = 'D'
                location_totals[normalized_location] = location_totals.get(normalized_location, 0) + 1
                
                # Count form quality per location for WDA% calculation
                fq = entry.get('fq', '')
                if fq in fq_totals:
                    fq_totals[fq] += 1
                    # Track FQ by location type (W, D, Dd, S)
                    if normalized_location in location_fq_counts:
                        location_fq_counts[normalized_location][fq] = location_fq_counts[normalized_location].get(fq, 0) + 1
            
            # Count determinants (array field)
            for det in entry.get('determinants', []):
                if det:
                    determinant_totals[det] = determinant_totals.get(det, 0) + 1
            
            # Count content (array field)
            for cont in entry.get('content', []):
                if cont:
                    content_totals[cont] = content_totals.get(cont, 0) + 1
            
            # Count DQ
            dq = entry.get('dq')
            if dq:
                dq_totals[dq] = dq_totals.get(dq, 0) + 1
            
            # Count special scores (array field)
            for score in entry.get('special_score', []):
                if score:
                    special_score_totals[score] = special_score_totals.get(score, 0) + 1
            
            # Count popular responses
            if entry.get('is_popular'):
                popular_responses += 1
    
    # Calculate Form Quality percentages according to Exner
    # XA% = (FQo + FQ+ + FQu) / R
    xa_numerator = fq_totals['o'] + fq_totals['+'] + fq_totals['u']
    xa_percent = round((xa_numerator / total_responses * 100), 2) if total_responses > 0 else 0
    
    # X+% = (FQo + FQ+) / R
    x_plus_numerator = fq_totals['o'] + fq_totals['+']
    x_plus_percent = round((x_plus_numerator / total_responses * 100), 2) if total_responses > 0 else 0
    
    # X-% = FQ- / R
    x_minus_percent = round((fq_totals['-'] / total_responses * 100), 2) if total_responses > 0 else 0
    
    # WDA% = (W_good + D_good) / (W_total + D_total)
    # Where "good" means FQ of 'o' or '+'
    w_good = location_fq_counts['W']['o'] + location_fq_counts['W']['+']
    d_good = location_fq_counts['D']['o'] + location_fq_counts['D']['+']
    w_total = sum(location_fq_counts['W'].values())
    d_total = sum(location_fq_counts['D'].values())
    wda_denominator = w_total + d_total
    wda_percent = round(((w_good + d_good) / wda_denominator * 100), 2) if wda_denominator > 0 else 0
    
    form_quality_data = {
        'fq_totals': fq_totals,
        'XA_percent': xa_percent,
        'X_plus_percent': x_plus_percent,
        'X_minus_percent': x_minus_percent,
        'WDA_percent': wda_percent,
        'location_fq_counts': location_fq_counts
    }
    
    return SummaryStatistics(
        total_responses=total_responses,
        location_totals=location_totals,
        determinant_totals=determinant_totals,
        content_totals=content_totals,
        dq_totals=dq_totals,
        popular_responses=popular_responses,
        form_quality=form_quality_data,
        special_scores=special_score_totals
    )

@app.delete("/patient/{patient_id}", response_model=dict)
async def delete_patient_endpoint(patient_id: str, db: AsyncIOMotorClient = Depends(get_database)):
    """Delete a patient by patient_id"""
    success = await delete_patient(db, patient_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Patient with ID {patient_id} not found or not deleted")
    return {"success": True, "message": f"Patient {patient_id} deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)