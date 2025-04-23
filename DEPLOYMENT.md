# Deployment Guide for InkSight

This guide will walk you through the steps to deploy the InkSight psychological test system with:
- Backend on Render
- Frontend on Vercel
- MongoDB Atlas for the database

## Prerequisites

- GitHub account with your project code
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)

## Step 1: Set up MongoDB Atlas

1. Sign up for a free MongoDB Atlas account
2. Create a new cluster (the free tier is sufficient to start)
3. Set up a database user with read/write permissions
4. Configure network access (allow access from anywhere for development or specific IPs for production)
5. Get your MongoDB connection string:
   - Go to "Connect" > "Connect your application"
   - Copy the connection string (it will look like: `mongodb+srv://username:password@clusterXXX.mongodb.net/`)
   - Replace `<password>` with your database user's password

## Step 2: Deploy the Backend to Render

1. Push your code to a GitHub repository
2. Log in to Render and click "New Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: inksight-backend (or your preferred name)
   - **Environment**: Python
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `cd backend && python run.py`
   - **Add Environment Variables**:
     - `MONGO_URI`: Your MongoDB Atlas connection string
     - `PORT`: Leave this blank, Render will set it automatically
     - `MONGO_DB`: inksight (or your preferred database name) 

5. Click "Create Web Service"
6. Note your Render service URL (e.g., `https://inksight-backend.onrender.com`)

## Step 3: Update Frontend API Configuration

1. Open `app/lib/api.js` and update the `API_BASE_URL` to point to your Render deployment:
   ```javascript
   export const API_BASE_URL = isDevelopment 
     ? 'http://localhost:8000' 
     : 'https://inksight-backend.onrender.com'; // Update with your actual Render URL
   ```

2. Open `backend/app/main.py` and update the CORS configuration to include your Vercel domain:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "http://localhost:3000", 
           "https://inksight.vercel.app"  # Update with your actual Vercel domain
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

## Step 4: Deploy the Frontend to Vercel

1. Push the updated code to your GitHub repository
2. Log in to Vercel and click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (should be set automatically)
   - **Output Directory**: `.next` (should be set automatically)
   - **Install Command**: `npm install` (should be set automatically)

5. Click "Deploy"
6. Note your Vercel deployment URL (e.g., `https://inksight.vercel.app`)

## Step 5: Update CORS Configuration

After deploying to Vercel, make sure to update the CORS configuration in your backend to allow requests from your Vercel domain:

1. In Render, go to your web service
2. Add or update the environment variable:
   - `ALLOWED_ORIGINS`: `http://localhost:3000,https://your-vercel-domain.vercel.app`

## Step 6: Testing the Deployment

1. Visit your Vercel deployment URL
2. Test creating a new patient/test
3. Test viewing patient data
4. Check that all API calls to the backend are working correctly

## Troubleshooting

### Backend Issues:
- **Database Connection Errors**: Verify your MongoDB connection string and network access settings
- **CORS Errors**: Ensure the CORS configuration allows your Vercel domain
- **Environment Variables**: Double-check that all required environment variables are set in Render

### MongoDB Atlas SSL Issues on Render.com

If you encounter SSL handshake errors with MongoDB Atlas on Render.com, like:

```
pymongo.errors.ServerSelectionTimeoutError: SSL handshake failed: [SSL: TLSV1_ALERT_INTERNAL_ERROR] tlsv1 alert internal error (_ssl.c:1006)
```

This is usually caused by a compatibility issue between the versions of Python, OpenSSL, and the MongoDB drivers. Here's how to fix it:

1. **Update your MongoDB connection string format**:
   - Make sure you're using the SRV format: `mongodb+srv://username:password@cluster.mongodb.net/database`
   - Remove any connection options from the URL and set them in the code instead

2. **Add connection options in your code**:
   - Our updated implementation already includes the necessary settings to handle SSL errors

3. **Check MongoDB Atlas Network Settings**:
   - Go to Network Access in MongoDB Atlas
   - Add the IP address of your Render.com service (or use 0.0.0.0/0 to allow all IPs temporarily)
   - Ensure "Allow access from anywhere" is enabled for testing

4. **Check Render.com environment variables**:
   - Make sure your `MONGO_URI` is correct and includes the SRV format
   - Verify the username and password in the URI are properly URL-encoded
   
5. **Force TLS/SSL settings in connection**:
   - Our updated code includes settings like `tlsAllowInvalidCertificates=True` which helps with SSL issues

6. **Use dependency version pinning**:
   - Our updated requirements.txt specifies exact versions of libraries known to work together
   - pymongo[srv]==4.6.1
   - dnspython==2.4.2
   - pyopenssl==24.0.0
   - certifi==2024.2.2
   
If you continue to have issues, try deploying a basic "connection-only" app to diagnose the specific issue by running our included startup diagnostics command.

### Running the MongoDB Diagnostic Tool

To help diagnose MongoDB connection issues, we've included a diagnostic tool. You can run it either locally or on Render.com:

#### Running locally:
```bash
cd backend
python mongo_diagnostic.py
```

#### Running on Render.com:
1. In Render dashboard, go to your web service
2. Open the Shell tab
3. Execute the following commands:
```bash
cd /opt/render/project/src/backend
python mongo_diagnostic.py
```

The diagnostic tool will:
1. Display system information (Python version, SSL version, etc.)
2. Test DNS resolution for your MongoDB host
3. Test TCP connectivity to MongoDB servers
4. Attempt to establish a MongoDB connection
5. Provide detailed error messages and suggested fixes

This is particularly useful for diagnosing SSL/TLS issues with MongoDB Atlas on Render.com.

### Frontend Issues:
- **API Connection Errors**: Verify the API_BASE_URL in api.js is correct
- **Build Errors**: Check Vercel build logs for any errors
- **Rendering Issues**: Check browser console for JavaScript errors
- **Suspense Boundaries**: If you see errors like "useSearchParams() should be wrapped in a suspense boundary", ensure that components using navigation hooks like `useSearchParams` or `useParams` are properly wrapped in a Suspense boundary

### Fixing Suspense Boundary Errors

If you encounter errors related to suspense boundaries during deployment:

1. Wrap components using `useSearchParams` or `useParams` in a Suspense boundary:
   ```jsx
   import { Suspense } from 'react';
   
   export default function Page() {
     return (
       <Suspense fallback={<LoadingComponent />}>
         <YourClientComponent />
       </Suspense>
     );
   }
   ```

2. Ensure your `next.config.mjs` has the proper configuration:
   ```js
   const nextConfig = {
     reactStrictMode: true,
     experimental: {
       serverComponentsExternalPackages: ['framer-motion'],
     },
     // Additional configurations to ignore non-critical errors during build
     eslint: {
       ignoreDuringBuilds: true,
     },
   };
   ```

3. For persistent issues, you may need to add a `.env` file with:
   ```
   NEXT_PUBLIC_SUSPENSE_ENABLED=1
   ```

## Local Development After Deployment

The API configuration is designed to use the local backend during development and the deployed backend in production.

To run the application locally:
1. Start the backend server: `cd backend && python run.py`
2. Start the frontend development server: `npm run dev`

The application will automatically use `http://localhost:8000` as the API base URL when running in development mode. 