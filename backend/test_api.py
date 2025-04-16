import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_api_endpoints():
    """Test the MongoDB API endpoints."""
    
    print("\n=== Testing API Endpoints ===\n")
    
    # 1. Test the root endpoint
    print("Testing root endpoint...")
    response = requests.get(f"{BASE_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    # 2. Test getting all patients
    print("Testing GET /patients...")
    response = requests.get(f"{BASE_URL}/patients")
    print(f"Status: {response.status_code}")
    patients = response.json()
    
    if patients:
        print(f"Found {len(patients)} patients:")
        for patient in patients:
            print(f"  - {patient['name']} (ID: {patient['patient_id']})")
    else:
        print("No patients found.")
    print()
    
    # 3. Test getting a specific patient
    if patients:
        patient_id = patients[0]['patient_id']
        print(f"Testing GET /patient/{patient_id}...")
        response = requests.get(f"{BASE_URL}/patient/{patient_id}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            patient = response.json()
            print(f"Patient: {patient['name']}")
            print(f"Total responses: {sum(len(img['entries']) for img in patient['responses'])}")
        print()
    
    # 4. Test submitting a new patient
    print("Testing POST /submit-patient...")
    
    # Create a sample patient
    patient_data = {
        "patient_id": f"P{datetime.now().strftime('%m%d%H%M%S')}",
        "name": "Test Patient",
        "age": 30,
        "gender": "Other",
        "examiner_name": "Test Examiner",
        "test_location": "Test Location",
        "test_duration": "30 minutes",
        "test_conditions": "Test conditions",
        "test_notes": "Created by test script",
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
                        "special_score": []
                    }
                ]
            }
        ]
    }
    
    response = requests.post(
        f"{BASE_URL}/submit-patient",
        json=patient_data
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()
    
    if response.status_code == 200:
        submitted_patient_id = patient_data["patient_id"]
        
        # 5. Test updating responses
        print(f"Testing PUT /patient/{submitted_patient_id}/responses...")
        
        # Updated responses
        updated_responses = [
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
                        "special_score": []
                    },
                    {
                        "position": "v",
                        "response_text": "A butterfly",
                        "number_of_responses": 1,
                        "determinants": ["FC"],
                        "content": ["A"],
                        "dq": "o",
                        "z_score": "",
                        "special_score": []
                    }
                ]
            },
            {
                "image_number": 2,
                "entries": [
                    {
                        "position": "^",
                        "response_text": "Two people dancing",
                        "number_of_responses": 1,
                        "determinants": ["M"],
                        "content": ["H"],
                        "dq": "o",
                        "z_score": "",
                        "special_score": []
                    }
                ]
            }
        ]
        
        response = requests.put(
            f"{BASE_URL}/patient/{submitted_patient_id}/responses",
            json=updated_responses
        )
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print()
        
        # 6. Verify the updated patient
        print(f"Verifying updated patient...")
        response = requests.get(f"{BASE_URL}/patient/{submitted_patient_id}")
        if response.status_code == 200:
            patient = response.json()
            total_entries = sum(len(img['entries']) for img in patient['responses'])
            print(f"Patient: {patient['name']}")
            print(f"Total responses: {total_entries}")
            print(f"Number of images: {len(patient['responses'])}")
        print()
    
    print("=== Testing Complete ===")

if __name__ == "__main__":
    test_api_endpoints() 