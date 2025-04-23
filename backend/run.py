import uvicorn
import os
import sys
import subprocess
import time

def check_mongo_connection():
    """Run the MongoDB connection check script"""
    try:
        print("Running MongoDB connection diagnostic check...")
        # Import the module and run the check in the same process
        from app.startup import check_mongodb_connection
        import asyncio
        
        # Run the connection check
        result = asyncio.run(check_mongodb_connection())
        
        if not result:
            print("⚠️ Warning: Could not establish MongoDB connection")
            print("The application may start but could have database errors")
            # Continue running - the app has error handling
        return result
    except Exception as e:
        print(f"Error running MongoDB diagnostic: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting Psychological Test Form Backend server...")
    
    # Get port from environment variable (provided by Render) or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Set the server URLs for local vs deployment
    if os.environ.get("RENDER"):
        print(f"Running in Render.com deployment mode on port {port}")
    else:
        print(f"Running in local development mode on port {port}")
    
    # Check MongoDB connection before starting the server
    mongo_ok = check_mongo_connection()
    
    # Startup banner
    print("\n" + "=" * 50)
    print("         PSYCHOLOGICAL TEST API SERVER")
    print("=" * 50)
    print(f"Server starting on port: {port}")
    print(f"MongoDB connection test: {'✅ OK' if mongo_ok else '⚠️ Issues detected'}")
    print(f"Environment: {'Production' if os.environ.get('RENDER') else 'Development'}")
    print("=" * 50 + "\n")
    
    # Start the server with appropriate settings
    try:
        uvicorn.run(
            "app.main:app", 
            host="0.0.0.0", 
            port=port,
            log_level="info",
            reload=not os.environ.get("RENDER")  # Only use reload in development
        )
    except Exception as e:
        print(f"Server failed to start: {str(e)}")
        sys.exit(1)
