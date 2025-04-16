import asyncio
import json
from datetime import datetime
from bson import ObjectId

from .db import get_all_patients, db

# Sample test patient data
test_patients = [
    {
        "patient_id": "P001",
        "name": "John Doe",
        "age": 28,
        "gender": "Male",
        "test_date": datetime.now(),
        "examiner_name": "Dr. Smith",
        "test_location": "Clinic Room 3",
        "test_duration": "45 minutes",
        "test_conditions": "Quiet room, good lighting",
        "test_notes": "Patient was cooperative",
        "created_at": datetime.now(),
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
                    },
                    {
                        "position": "<",
                        "response_text": "Butterfly",
                        "number_of_responses": 1,
                        "determinants": ["FC"],
                        "content": ["A"],
                        "dq": "+",
                        "z_score": "ZA",
                        "special_score": [],
                        "location": "W",
                        "fq": "o"
                    }
                ]
            },
            {
                "image_number": 2,
                "entries": [
                    {
                        "position": "v",
                        "response_text": "Two people dancing",
                        "number_of_responses": 1,
                        "determinants": ["M"],
                        "content": ["H"],
                        "dq": "o",
                        "z_score": "ZA",
                        "special_score": [],
                        "location": "D1",
                        "fq": "u"
                    }
                ]
            }
        ]
    },
    {
        "patient_id": "P002",
        "name": "Jane Smith",
        "age": 35,
        "gender": "Female",
        "test_date": datetime.now(),
        "examiner_name": "Dr. Johnson",
        "test_location": "Private Office",
        "test_duration": "60 minutes",
        "test_conditions": "Standard testing conditions",
        "test_notes": "Patient was initially anxious but relaxed as the test progressed",
        "created_at": datetime.now(),
        "responses": [
            {
                "image_number": 1,
                "entries": [
                    {
                        "position": "^",
                        "response_text": "A bat",
                        "number_of_responses": 1,
                        "determinants": ["F"],
                        "content": ["A"],
                        "dq": "o",
                        "z_score": "",
                        "special_score": [],
                        "location": "W",
                        "fq": "o"
                    }
                ]
            }
        ]
    }
]

async def add_test_data():
    """Add test data to MongoDB if the database is empty."""
    # Check if we already have patients
    patients = await get_all_patients()
    
    if len(patients) == 0:
        print("Adding test patients to MongoDB...")
        
        for patient in test_patients:
            try:
                # Insert into MongoDB directly
                await db.patients.insert_one(patient)
                print(f"Added patient {patient['name']} with ID {patient['patient_id']}")
            except Exception as e:
                print(f"Error adding test patient: {str(e)}")
        
        print("Test data added successfully!")
    else:
        print(f"Database already has {len(patients)} patients. Skipping test data.")

if __name__ == "__main__":
    # Run the function to add test data
    asyncio.run(add_test_data()) 