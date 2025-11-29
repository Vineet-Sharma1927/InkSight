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
- Firebase account (https://firebase.google.com)

## Step 1: Set up Firebase

Firebase is used for user authentication and storing patient data in Firestore.

### 1.1 Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Enter a project name (e.g., "InkSight")
4. Follow the setup wizard (you can disable Google Analytics if not needed)

### 1.2 Enable Authentication

1. In your Firebase project, go to **Authentication** from the left sidebar
2. Click "Get started"
3. Enable **Email/Password** authentication:
   - Click on "Email/Password" in the Sign-in providers list
   - Toggle "Enable" to ON
   - Click "Save"

### 1.3 Set up Firestore Database

1. In your Firebase project, go to **Firestore Database** from the left sidebar
2. Click "Create database"
3. Choose **Start in production mode** (you'll configure rules later)
4. Select a Firestore location closest to your users
5. Click "Enable"

### 1.4 Configure Firestore Security Rules

1. In Firestore Database, go to the **Rules** tab
2. Replace the default rules with the following to allow authenticated users to access their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to access only their own data
    match /doctors/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

### 1.5 Get Firebase Configuration

1. In your Firebase project, go to **Project Settings** (gear icon in the left sidebar)
2. Scroll down to "Your apps" section
3. Click on the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "InkSight Web")
5. Copy the Firebase configuration object. It will look like:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

6. Keep this configuration handy - you'll need it for environment variables

### 1.6 Create Environment Variables File

Create a `.env.local` file in the root of your project with your Firebase configuration:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

**Important**: Never commit `.env.local` to your repository. Make sure it's listed in your `.gitignore` file.

## Step 2: Set up MongoDB Atlas

1. Sign up for a free MongoDB Atlas account
2. Create a new cluster (the free tier is sufficient to start)
3. Set up a database user with read/write permissions
4. Configure network access (allow access from anywhere for development or specific IPs for production)
5. Get your MongoDB connection string:
   - Go to "Connect" > "Connect your application"
   - Copy the connection string (it will look like: `mongodb+srv://username:password@clusterXXX.mongodb.net/`)
   - Replace `<password>` with your database user's password

## Step 3: Deploy the Backend to Render

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

## Step 4: Update Frontend API Configuration

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

5. **Add Environment Variables** in Vercel (very important!):
   - Click on "Environment Variables" section
   - Add each of your Firebase configuration values:
     - `NEXT_PUBLIC_FIREBASE_API_KEY`: Your Firebase API key
     - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
     - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Your Firebase project ID
     - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
     - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
     - `NEXT_PUBLIC_FIREBASE_APP_ID`: Your Firebase app ID

6. Click "Deploy"
7. Note your Vercel deployment URL (e.g., `https://inksight.vercel.app`)

### Important: Configure Firebase for Production Domain

After deploying to Vercel, you need to authorize your Vercel domain in Firebase:

1. Go to your Firebase Console
2. Navigate to **Authentication** > **Settings** > **Authorized domains**
3. Click "Add domain"
4. Add your Vercel domain (e.g., `inksight.vercel.app`)
5. Click "Add"

This allows Firebase Authentication to work on your production domain.

## Step 5: Update CORS Configuration

After deploying to Vercel, make sure to update the CORS configuration in your backend to allow requests from your Vercel domain:

1. In Render, go to your web service
2. Add or update the environment variable:
   - `ALLOWED_ORIGINS`: `http://localhost:3000,https://your-vercel-domain.vercel.app`

## Step 6: Testing the Deployment

1. Visit your Vercel deployment URL
2. **Test Authentication**:
   - Click "Sign Up" to create a new account
   - Verify you receive a confirmation email (if email verification is enabled)
   - Log in with your credentials
   - Test the "Forgot Password" functionality
3. **Test Patient Management**:
   - Create a new patient/test
   - View patient data
   - Navigate between different images in the test form
4. **Test Data Persistence**:
   - Check that responses are saved in both Firebase Firestore and MongoDB
   - Verify that all API calls to the backend are working correctly
5. **Test Navigation**:
   - Verify that the Previous/Next image buttons work
   - Test that saved responses load correctly when navigating back

## Troubleshooting

### Firebase Authentication Issues:
- **"Auth domain not authorized"**: Make sure your Vercel domain is added to Firebase's Authorized domains list
- **Environment variables not working**: Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set in Vercel
- **"Firebase config missing"**: Check browser console for which specific environment variable is missing
- **Login/Signup not working**: Verify that Email/Password authentication is enabled in Firebase Console
- **Firestore permission denied**: Check your Firestore security rules allow authenticated users to read/write

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

1. **Set up local environment variables**:
   - Create a `.env.local` file in the project root (if not already created)
   - Add all Firebase configuration variables as shown in Step 1.6

2. **Start the backend server**: 
   ```bash
   cd backend
   python run.py
   ```

3. **Start the frontend development server**: 
   ```bash
   npm run dev
   ```

The application will automatically use `http://localhost:8000` as the API base URL when running in development mode.

### Testing Firebase Locally

To test Firebase authentication and Firestore locally:

1. Make sure your `.env.local` file has all the Firebase environment variables
2. The Firebase configuration will automatically use your production Firebase project
3. You can create test accounts for development purposes
4. Firestore data will be stored in your production database (consider creating a separate Firebase project for development)

### Best Practices for Development

1. **Separate Firebase Projects**: Consider creating separate Firebase projects for development and production
2. **Use Firebase Emulator**: For offline development, you can use the Firebase Local Emulator Suite
3. **Environment-specific Configuration**: Use different Firebase projects for different environments by conditionally loading config based on `process.env.NODE_ENV`
4. **Security Rules Testing**: Test Firestore security rules in the Firebase Console's Rules Playground before deploying 