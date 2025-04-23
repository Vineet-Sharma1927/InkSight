# InkSight Psychological Test Form

A web application for administering and analyzing psychological tests, specifically designed for Rorschach inkblot tests.

## Features

- Input and analyze responses to inkblot images
- Store and retrieve patient data
- Generate summary reports
- User-friendly interface with responsive design

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Uvicorn
- **Database**: MongoDB
- **Deployment**: Vercel (frontend), Render (backend)

## Recent Updates

- Added common API configuration for deployment
- Set up CORS for deployment environments
- Created deployment guide
- Improved frontend-backend integration
- Updated environment variable handling

## Deployment

This application is configured for deployment with:
- Frontend on Vercel
- Backend on Render
- MongoDB Atlas for the database

For full deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)

## Local Development

### Prerequisites

- Node.js (>= 18.0.0)
- Python (>= 3.8)
- MongoDB

### Setup

1. Clone the repository
2. Install frontend dependencies:
   ```
   npm install
   ```
3. Install backend dependencies:
   ```
   cd backend
   pip install -r requirements.txt
   ```
4. Start MongoDB (local or via connection string)
5. Set environment variables:
   - Create `.env.local` in the backend directory with MongoDB connection info

### Running the Application

1. Start the backend server:
   ```
   cd backend
   python run.py
   ```
2. Start the frontend development server:
   ```
   npm run dev
   ```
3. Access the application at `http://localhost:3000`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by psychological testing methodologies
- Built with modern web technologies
