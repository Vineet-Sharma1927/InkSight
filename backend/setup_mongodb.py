"""
MongoDB setup script for Psychological Test Application.
This script creates the necessary collections and indexes
when MongoDB is installed locally.
"""

import asyncio
import pymongo
from pymongo import MongoClient
from datetime import datetime

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "psychological_test_db"

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
                    }
                ]
            }
        ]
    }
]

def setup_mongodb():
    """Set up MongoDB database, collections, and indexes."""
    print(f"Connecting to MongoDB at {MONGO_URI}...")
    
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        
        # Check connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        
        # Create collections
        if "patients" not in db.list_collection_names():
            db.create_collection("patients")
            print("Created 'patients' collection")
        else:
            print("'patients' collection already exists")
        
        # Create indexes
        db.patients.create_index("patient_id", unique=True)
        print("Created index on patient_id")
        
        # Add test data
        patient_count = db.patients.count_documents({})
        if patient_count == 0:
            print("Adding test patients...")
            
            for patient in test_patients:
                try:
                    db.patients.insert_one(patient)
                    print(f"Added patient: {patient['name']}")
                except pymongo.errors.DuplicateKeyError:
                    print(f"Patient with ID {patient['patient_id']} already exists")
                except Exception as e:
                    print(f"Error adding patient: {str(e)}")
            
            print(f"Added {len(test_patients)} test patients")
        else:
            print(f"Database already has {patient_count} patients. Skipping test data.")
        
        print("\nMongoDB setup complete!")
        
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
        print("\nTroubleshooting tips:")
        print("1. Make sure MongoDB is installed and running")
        print("2. Check if the MongoDB service is started")
        print("3. Try using MongoDB Compass to verify connection")
        print("4. Try using MongoDB Atlas instead (see README.md)")
        return False
    
    return True

if __name__ == "__main__":
    setup_mongodb() 