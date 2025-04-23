import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import ssl
import certifi

async def check_mongodb_connection():
    """
    Verify that the MongoDB connection is working properly
    This is a separate function from the main app to diagnose connection issues
    """
    try:
        mongo_uri = os.environ.get("MONGO_URI")
        if not mongo_uri:
            print("MONGO_URI not set in environment variables")
            return False
        
        print(f"Testing MongoDB connection...")
        
        # Create client with TLS/SSL options
        client = AsyncIOMotorClient(
            mongo_uri,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            ssl=True,
            ssl_cert_reqs=ssl.CERT_NONE,
            tls=True,
            tlsAllowInvalidCertificates=True
        )
        
        # Force a connection to verify it works
        await client.admin.command('ping')
        
        # Get server info
        server_info = await client.admin.command('serverStatus')
        version = server_info.get('version', 'unknown')
        
        print(f"✅ MongoDB connection successful!")
        print(f"   Server version: {version}")
        print(f"   Database: {client.get_default_database().name}")
        
        await client.close()
        return True
    except Exception as e:
        print(f"❌ MongoDB connection error: {str(e)}")
        print(f"   Connection string: {mongo_uri.split('@')[1] if '@' in mongo_uri else '(no connection string)'}")
        
        # Additional diagnostic info
        if 'SSL' in str(e) or 'TLS' in str(e):
            print("   This appears to be an SSL/TLS error. Check your MongoDB Atlas settings:")
            print("   - Ensure your IP is whitelisted in MongoDB Atlas")
            print("   - Verify you're using the latest connection string format (srv format)")
            print("   - Check if your MongoDB Atlas requires TLS 1.2 or higher")
        
        return False

if __name__ == "__main__":
    # Run the check when this file is executed directly
    asyncio.run(check_mongodb_connection()) 