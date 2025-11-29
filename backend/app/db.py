# db.py

import os
import ssl
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any, Annotated, Literal
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict

# --- Connection Management ---

class DataStore:
    client: AsyncIOMotorClient = None
    db = None

db_connection = DataStore()

async def connect_to_mongo():
    """Initializes the MongoDB client and database connection."""
    print("Connecting to MongoDB...")
    MONGO_URI = os.getenv("MONGO_URI")
    DATABASE_NAME = os.getenv("MONGO_DB")
    
    if not MONGO_URI or not DATABASE_NAME:
        raise ValueError("MONGO_URI and MONGO_DB environment variables must be set.")

    # Simplified and robust client creation
    db_connection.client = AsyncIOMotorClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000,
        tls=True,  # Generally required for Atlas
        tlsAllowInvalidCertificates=True # Use with caution, for development/Render
    )
    db_connection.db = db_connection.client[DATABASE_NAME]
    
    try:
        await db_connection.client.admin.command('ping')
        print("✅ MongoDB connection successful.")
        await create_indexes(db_connection.db)
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

async def close_mongo_connection():
    """Closes the MongoDB connection."""
    if db_connection.client:
        print("Closing MongoDB connection.")
        db_connection.client.close()

def get_database() -> AsyncIOMotorClient:
    """Dependency to get the database instance."""
    return db_connection.db

async def create_indexes(db: AsyncIOMotorClient):
    """Creates necessary indexes in the database."""
    try:
        if db:
            await db.patients.create_index("patient_id", unique=True)
            print("MongoDB indexes created successfully.")
    except Exception as e:
        print(f"Error creating indexes: {e}")

# --- Pydantic Models (Copied from your original file) ---

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v))]

class ResponseEntry(BaseModel):
    response_id: Optional[str] = None
    position: str
    response_text: str
    number_of_responses: int = 1
    determinants: List[str] = []
    content: List[str] = []
    dq: str = ""
    z_score: str = ""
    special_score: List[str] = []
    location: str = ""
    fq: str = ""
    is_popular: bool = False
    gemini_suggestions: Optional[Dict[str, str]] = None
    status: Literal["pending_review", "completed"] = "pending_review"

class ImageResponse(BaseModel):
    image_number: int
    entries: List[ResponseEntry] = []

class PatientModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    patient_id: str
    name: str
    age: int
    gender: str
    test_date: datetime = Field(default_factory=datetime.now)
    examiner_name: str = ""
    test_location: str = ""
    test_duration: str = ""
    test_conditions: str = ""
    test_notes: str = ""
    created_at: datetime = Field(default_factory=datetime.now)
    responses: List[ImageResponse] = []
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})

class PatientResponse(PatientModel):
    pass

class PatientBasicInfo(BaseModel):
    id: PyObjectId = Field(..., alias="_id")
    patient_id: str
    name: str
    age: int
    gender: str
    test_date: datetime
    created_at: datetime
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True, json_encoders={ObjectId: str})

# --- Refactored Database Operations ---
# Each function now accepts 'db' as a parameter.

async def insert_patient(db: AsyncIOMotorClient, patient_data: dict) -> str:
    patient = await db.patients.insert_one(patient_data)
    return str(patient.inserted_id)

async def get_patient_by_id(db: AsyncIOMotorClient, patient_id: str) -> Optional[dict]:
    return await db.patients.find_one({"patient_id": patient_id})

async def get_all_patients(db: AsyncIOMotorClient) -> List[dict]:
    cursor = db.patients.find({}, {
        "patient_id": 1, "name": 1, "age": 1, "gender": 1, "test_date": 1, "created_at": 1
    })
    return await cursor.to_list(length=1000)

async def update_patient_responses(db: AsyncIOMotorClient, patient_id: str, responses: List[dict]) -> bool:
    result = await db.patients.update_one(
        {"patient_id": patient_id}, 
        {"$set": {"responses": responses}}
    )
    return result.modified_count > 0

async def delete_patient(db: AsyncIOMotorClient, patient_id: str) -> bool:
    """Delete a patient by patient_id"""
    result = await db.patients.delete_one({"patient_id": patient_id})
    return result.deleted_count > 0