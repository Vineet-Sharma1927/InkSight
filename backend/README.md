# Psychological Test Response Analyzer

This backend application processes Rorschach test responses and performs fuzzy matching against reference data to determine Location and Form Quality (FQ) values. It also stores patient data and responses in MongoDB.

## CSV Reference Data Format

The system uses a CSV file with response reference data. The CSV file should be structured as follows:

```csv
image_id,response_text,location,fq
1,"A bat",W,o
1,"Two people dancing",D1,u
2,"A red butterfly",W,o
...
```

Where:
- `image_id`: The ID of the Rorschach card/image (1-10)
- `response_text`: The text of the response
- `location`: The location code (W, D1, D2, etc.)
- `fq`: The form quality rating (o, u, +, -)

## Setup Instructions

1. Create a `data` directory in the `backend` folder if it doesn't already exist:
   ```
   mkdir -p backend/data
   ```

2. Place your CSV reference data file in the `data` directory as `sample_table.csv`:
   ```
   cp your_reference_data.csv backend/data/sample_table.csv
   ```

3. Set up MongoDB (choose one option):

   **Option A: Install MongoDB Locally**
   - Download and install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
   - Start the MongoDB service
   - The application will connect to `mongodb://localhost:27017/` by default

   **Option B: Use MongoDB Atlas (Cloud)**
   - Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Set up a free cluster and get your connection string
   - Set the `MONGODB_URI` environment variable:
     ```
     # Windows
     set MONGODB_URI="mongodb+srv://vineet11vinu:GUyB704BDyVuraXp@cluster0.zvlutqi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
     
     # Linux/Mac
     export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/psychological_test_db"
     ```

4. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

5. Start the backend server:
   ```
   cd backend
   uvicorn app.main:app --reload
   ```

## MongoDB

The application uses MongoDB to store patient data and their responses. The database schema is as follows:

### Patient Document Structure

```json
{
  "_id": "ObjectId",
  "patient_id": "P001",
  "name": "John Doe",
  "age": 28,
  "gender": "Male",
  "test_date": "2024-04-10T10:00:00Z",
  "examiner_name": "Dr. Smith",
  "test_location": "Clinic Room 3",
  "test_duration": "45 minutes",
  "test_conditions": "Quiet room, good lighting",
  "test_notes": "Patient was cooperative",
  "created_at": "2024-04-10T10:00:00Z",
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
          "location": "Dd",  // auto-filled by backend
          "fq": "o"          // auto-filled by backend
        }
      ]
    }
  ]
}
```

### MongoDB Admin Interface

You can access the MongoDB admin interface at http://localhost:8081 to view and manage the database directly.

- Username: `root`
- Password: `example`

## API Endpoints

### Reference Data Endpoints

- `GET /`: Check if the API is running
- `GET /tables-info`: Get information about all tables/images extracted from the CSV
- `POST /analyze-response`: Analyze a response text for a specific image ID

### Patient Data Endpoints

- `POST /submit-patient`: Submit a complete patient record with all responses
- `GET /patient/{patient_id}`: Retrieve a patient record by ID
- `GET /patients`: List all patients with basic information
- `PUT /patient/{patient_id}/responses`: Update a patient's responses

## How the System Works

1. When the backend starts, it loads the reference data from the CSV file
2. When a response is submitted, it uses fuzzy matching to find the most similar response in the reference data
3. If a match is found (with a confidence score of 70% or higher), it returns the location and FQ values
4. The frontend displays these values to the user
5. Patient data and responses are stored in MongoDB for later retrieval

## Environment Variables

The following environment variables can be set to configure the application:

- `MONGODB_URI`: MongoDB connection string (default: `mongodb://root:example@localhost:27017/`)
- `MONGODB_DB`: MongoDB database name (default: `psychological_test_db`)
