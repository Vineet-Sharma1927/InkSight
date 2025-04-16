# InkSight Deployment Guide

This document outlines the steps to deploy the InkSight application, with the frontend on Vercel and the backend on Render.

## Prerequisites

- GitHub account
- Vercel account
- Render account
- MongoDB Atlas account (for the database)

## Backend Deployment (Render)

1. **Prepare MongoDB Atlas**
   - Create a MongoDB Atlas account if you don't have one
   - Create a new cluster
   - Create a database named `inksight`
   - Create a database user with read/write permissions
   - Whitelist connections from anywhere (`0.0.0.0/0`) for simplicity, but in production, you should restrict this to your application's IP

2. **Deploy to Render**
   - Sign up/login to Render
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your application
   - Configure the service:
     - Name: `inksight-api` (or your preferred name)
     - Environment: Python
     - Region: Choose the region closest to your users
     - Branch: `main` (or your deployment branch)
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     - Instance Type: Free (for development/testing)
     - Add the following environment variables:
       - `MONGODB_URI`: Your MongoDB Atlas connection string
       - `MONGODB_DB_NAME`: `inksight`
       - `ALLOW_ORIGINS`: Your frontend URL (e.g., `https://inksight.vercel.app`)
     - Click "Create Web Service"

3. **Verify Backend Deployment**
   - Once deployed, Render will provide a URL for your service
   - Visit this URL to confirm the API is running
   - Test the `/health` endpoint to ensure it returns a status of "ok"
   - Make note of your backend URL for frontend configuration

## Frontend Deployment (Vercel)

1. **Prepare Environment Variables**
   - You'll need to set up the following environment variable in Vercel:
     - `NEXT_PUBLIC_API_URL`: The URL of your backend (e.g., `https://inksight-api.onrender.com`)

2. **Deploy to Vercel**
   - Sign up/login to Vercel
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: Leave as `/` (unless your frontend is in a subfolder)
     - Build Command: `next build`
     - Output Directory: `.next`
     - Set environment variables:
       - Add `NEXT_PUBLIC_API_URL` with your backend URL
     - Click "Deploy"

3. **Verify Frontend Deployment**
   - Once deployed, Vercel will provide a URL for your application
   - Visit this URL to confirm the frontend is running correctly
   - Test the integration with the backend by creating a test patient

## Post-Deployment Steps

1. **Update Backend CORS**
   - If needed, update the `ALLOW_ORIGINS` environment variable in Render to include your Vercel URL

2. **Custom Domain (Optional)**
   - For both Vercel and Render, you can add a custom domain in their respective settings
   - Follow the DNS configuration instructions provided by each platform

3. **Performance Monitoring**
   - Set up monitoring and alerts in both platforms to keep track of service health
   - Consider upgrading plans for production usage with higher traffic

## Troubleshooting

- **CORS Issues**: If you encounter CORS errors, verify that the `ALLOW_ORIGINS` in your backend includes the correct frontend URL
- **500 Errors**: Check the Render logs for any server-side errors
- **404 Errors**: Ensure paths are correctly configured in your application
- **Slow Initial Response**: Free tier services may have cold starts; consider upgrading for production use

## Maintenance

- **Updating the Application**:
  - Push changes to your repository
  - Vercel and Render will automatically redeploy your application
- **Database Backups**:
  - Configure regular backups of your MongoDB data through Atlas
- **Environment Variables**:
  - If you need to change environment variables, update them in the respective platform's dashboard

## Security Considerations

- Use environment variables for all sensitive information
- Never commit .env files to your repository
- Consider implementing rate limiting for your API
- Set up proper authentication for your application 