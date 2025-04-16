'use client';

/**
 * Configuration for different environments
 * The API URL will be automatically determined based on the running environment
 */
const config = {
  // API base URL - use environment variable or default based on environment
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 
    (typeof window !== 'undefined' && window.location.hostname === 'localhost' 
      ? 'http://localhost:8000'
      : 'https://inksight-api.onrender.com'),
      
  // Version
  version: '1.0.0',
  
  // Application name
  appName: 'InkSight',
  
  // Feature flags
  features: {
    enablePdfDownload: true,
    showDebugInfo: process.env.NODE_ENV === 'development'
  }
};

export default config; 