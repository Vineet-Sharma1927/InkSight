import motor.motor_asyncio
from bson import ObjectId
from datetime import datetime
from typing import List, Optional, Dict, Any, Annotated
from pydantic import BaseModel, Field, BeforeValidator, ConfigDict
import os
import ssl
import urllib.parse

# MongoDB connection - get credentials from environment or use defaults
MONGO_URI = os.environ.get("MONGO_URI")
DATABASE_NAME = os.environ.get("MONGO_DB", "psychological_test_db")

# Configure SSL options for MongoDB Atlas
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Print connection info for debugging (remove in production)
print(f"Connecting to MongoDB: DATABASE_NAME={DATABASE_NAME}")

# Create client with SSL options
try:
    if MONGO_URI:
        client = motor.motor_asyncio.AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=20000,
            ssl=True,
            ssl_cert_reqs=ssl.CERT_NONE,
            retryWrites=False,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
    else:
        print("Warning: No MONGO_URI found. Using default localhost connection.")
        client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    
    db = client[DATABASE_NAME]
    print("MongoDB client initialized successfully")
except Exception as e:
    print(f"Error initializing MongoDB client: {str(e)}")
    # Fallback to ensure the app doesn't crash completely during initialization
    client = None
    db = None

# Create indexes
async def create_indexes():
    try:
        if db:
            await db.patients.create_index("patient_id", unique=True)
            print("MongoDB indexes created successfully")
        else:
            print("Cannot create indexes: Database connection not established")
    except Exception as e:
        print(f"Error creating indexes: {str(e)}")

# Convert ObjectId to str and validate ObjectId
def validate_object_id(v: Any) -> ObjectId:
    if isinstance(v, ObjectId):
        return v
    if isinstance(v, str) and ObjectId.is_valid(v):
        return ObjectId(v)
    raise ValueError("Invalid ObjectId")

# ObjectId type
PyObjectId = Annotated[str, BeforeValidator(validate_object_id)]

# MongoDB models
class ResponseEntry(BaseModel):
    position: str
    response_text: str
    number_of_responses: int = 1
    determinants: List[str] = []
    content: List[str] = []
    dq: str = ""
    z_score: str = ""
    special_score: List[str] = []
    location: str = ""  # Auto-filled by backend
    fq: str = ""  # Auto-filled by backend
    
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "position": "^",
                "response_text": "Cockroach",
                "number_of_responses": 1,
                "determinants": ["F"],
                "content": ["A"],
                "dq": "o",
                "z_score": "ZA", 
                "special_score": ["DV"],
                "location": "Dd",
                "fq": "o"
            }
        }
    )

class ImageResponse(BaseModel):
    image_number: int
    entries: List[ResponseEntry] = []
    
    model_config = ConfigDict(
        populate_by_name=True,
        json_schema_extra={
            "example": {
                "image_number": 1,
                "entries": [
                    {
                        "position": "^",
                        "response_text": "Cockroach",
                        "number_of_responses": 1,
                        "determinants": ["F"],
                        "content": ["A"],
                        "dq": "o",
                        "z_score": "ZA", 
                        "special_score": ["DV"],
                        "location": "Dd",
                        "fq": "o"
                    }
                ]
            }
        }
    )

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
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_schema_extra={
            "example": {
                "patient_id": "P001",
                "name": "John Doe",
                "age": 28,
                "gender": "Male",
                "examiner_name": "Dr. Smith",
                "test_location": "Clinic Room 3",
                "test_duration": "45 minutes",
                "test_conditions": "Quiet room, good lighting",
                "test_notes": "Patient was cooperative",
                "responses": [
                    {
                        "image_number": 1,
                        "entries": [
                            {
                                "position": "^",
                                "response_text": "Cockroach",
                                "number_of_responses": 1,
                                "determinants": ["F"],
                                "content": ["A"],
                                "dq": "o",
                                "z_score": "ZA", 
                                "special_score": ["DV"],
                                "location": "Dd",
                                "fq": "o"
                            }
                        ]
                    }
                ]
            }
        }
    )

class PatientResponse(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    name: str
    age: int
    gender: str
    test_date: datetime
    examiner_name: str = ""
    test_location: str = ""
    test_duration: str = ""
    test_conditions: str = ""
    test_notes: str = ""
    created_at: datetime
    responses: List[ImageResponse] = []
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

class PatientBasicInfo(BaseModel):
    id: str = Field(alias="_id")
    patient_id: str
    name: str
    age: int
    gender: str
    test_date: datetime
    created_at: datetime
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True
    )

# Database operations
async def insert_patient(patient_data: dict) -> str:
    try:
        if not db:
            raise Exception("Database connection not established")
        patient = await db.patients.insert_one(patient_data)
        return str(patient.inserted_id)
    except Exception as e:
        print(f"Error inserting patient: {str(e)}")
        raise

async def get_patient_by_id(patient_id: str) -> Optional[dict]:
    try:
        if not db:
            raise Exception("Database connection not established")
        return await db.patients.find_one({"patient_id": patient_id})
    except Exception as e:
        print(f"Error getting patient by ID: {str(e)}")
        raise

async def get_all_patients() -> List[dict]:
    try:
        if not db:
            raise Exception("Database connection not established")
        patients = []
        cursor = db.patients.find({}, {
            "patient_id": 1,
            "name": 1,
            "age": 1,
            "gender": 1,
            "test_date": 1,
            "created_at": 1
        })
        async for document in cursor:
            patients.append(document)
        return patients
    except Exception as e:
        print(f"Error getting all patients: {str(e)}")
        return []

async def update_patient_responses(patient_id: str, responses: List[dict]) -> bool:
    try:
        if not db:
            raise Exception("Database connection not established")
        result = await db.patients.update_one(
            {"patient_id": patient_id}, 
            {"$set": {"responses": responses}}
        )
        return result.modified_count > 0
    except Exception as e:
        print(f"Error updating patient responses: {str(e)}")
        return False 