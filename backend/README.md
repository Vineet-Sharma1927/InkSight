# InkSight Backend API

This is the backend API for the InkSight psychological testing application, built with FastAPI and MongoDB.

## Local Development

### Prerequisites
- Python 3.8+
- MongoDB (local instance or MongoDB Atlas)

### Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
Create a `.env.local` file with the following:

```
MONGO_URI=mongodb://localhost:27017/inksight
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/inksight
```

4. Start the server:
```bash
python run.py
```

The API should now be running at http://localhost:8000

## Deployment on Render.com

### Required Environment Variables

- `MONGO_URI`: Your MongoDB connection string
- `MONGO_DB`: Database name (default: "psychological_test_db")
- `PORT`: Set automatically by Render

### Troubleshooting MongoDB SSL Issues

If you encounter SSL handshake errors with MongoDB on Render.com, run the diagnostic tool:

```bash
cd /opt/render/project/src/backend
python mongo_diagnostic.py
```

Common fixes for SSL issues include:

1. Using the SRV connection string format:
```
mongodb+srv://username:password@cluster.mongodb.net/dbname
```

2. Making sure your MongoDB Atlas IP access list includes Render's IP or `0.0.0.0/0` for testing

3. Using the updated MongoDB driver configuration included in this application

For more detailed information, see the [Deployment Guide](../DEPLOYMENT.md).

## API Endpoints

- **GET /**: Check if API is running
- **POST /analyze-response**: Analyze a text response for a specific image
- **POST /submit-patient**: Submit a new patient record with all responses
- **GET /patient/{patient_id}**: Get a patient record by ID
- **GET /patients**: List all patients with basic information
- **PUT /patient/{patient_id}/responses**: Update a patient's responses

## Testing

Run the MongoDB connection diagnostic tool:
```bash
python mongo_diagnostic.py
```

## Files and Structure

- `app/` - Main application module
  - `main.py` - FastAPI application and routes
  - `db.py` - MongoDB connection and data models
  - `pdf_parser.py` - Response analysis logic
  - `test_data.py` - Test data generator
  - `startup.py` - Connection verification
- `data/` - Reference data for response analysis
- `run.py` - Server startup script
- `mongo_diagnostic.py` - MongoDB connection diagnostic tool
