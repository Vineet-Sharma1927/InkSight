from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from pathlib import Path
import json
from datetime import datetime
import asyncio

from .pdf_parser import ResponseAnalyzer
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
    create_indexes
)
from .test_data import add_test_data
from .startup import check_mongodb_connection

# Initialize FastAPI app
app = FastAPI(
    title="Psychological Test API",
    description="API for analyzing psychological test responses",
    version="1.0.0"
)

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://inksight.vercel.app"  # Update this with your actual Vercel domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the response analyzer
data_dir = Path(__file__).parent.parent / 'data'
data_dir.mkdir(exist_ok=True)
analyzer = ResponseAnalyzer(data_dir=str(data_dir))

# Define request and response models
class AnalyzeRequest(BaseModel):
    response_text: str
    image_id: int

class AnalyzeResponse(BaseModel):
    location: Optional[str] = None
    fq: Optional[str] = None
    match_found: bool
    message: Optional[str] = None

class TableInfo(BaseModel):
    image_id: int
    table_name: str
    num_rows: int

@app.on_event("startup")
async def startup_db_client():
    """
    Startup event to initialize database connection and indexes
    """
    print("Starting application initialization...")
    
    # Check MongoDB connection first
    connection_ok = await check_mongodb_connection()
    if not connection_ok:
        print("⚠️ Warning: MongoDB connection check failed, but continuing startup...")
    
    try:
        # Create indexes
        await create_indexes()
        
        # Add test data if database is empty
        await add_test_data()
        
        print("✅ Application initialization complete!")
    except Exception as e:
        print(f"❌ Error during startup: {str(e)}")
        print("⚠️ Application will continue to run but may have limited functionality")

@app.get("/")
async def root():
    """Root endpoint to check if the API is running."""
    return {"message": "Psychological Test Response Analyzer API is running"}

@app.get("/tables-info", response_model=List[TableInfo])
async def get_tables_info():
    """
    Get information about all tables extracted from the CSV.
    """
    tables_info = analyzer.get_tables_info()
    return tables_info

@app.post("/analyze-response", response_model=AnalyzeResponse)
async def analyze_response(request: AnalyzeRequest):
    """
    Analyze a response text for a specific image and return location and form quality values.
    
    Uses fuzzy matching to find the closest match in the reference data.
    """
    if not request.response_text or not request.response_text.strip():
        raise HTTPException(status_code=400, detail="Response text cannot be empty")
    
    if request.image_id < 1 or request.image_id > 10:
        raise HTTPException(status_code=400, detail="Image ID must be between 1 and 10")
    
    result = analyzer.analyze_response(request.response_text, request.image_id)
    
    if result:
        return AnalyzeResponse(
            location=result["location"],
            fq=result["fq"],
            match_found=True
        )
    else:
        return AnalyzeResponse(
            match_found=False,
            message="No matching response found in reference data"
        )

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
