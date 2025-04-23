"""
MongoDB Connection Diagnostic Tool for Render.com

This script helps diagnose MongoDB connection issues on Render.com.
Run this on Render with: python mongo_diagnostic.py
"""

import asyncio
import os
import sys
import ssl
import certifi
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
import urllib.parse
import socket
import platform
import subprocess

def print_header(text):
    print("\n" + "=" * 60)
    print(f" {text}")
    print("=" * 60)

def print_info(label, value):
    print(f"{label.ljust(25)}: {value}")

def print_error(text):
    print(f"❌ ERROR: {text}")

def print_success(text):
    print(f"✅ SUCCESS: {text}")

def print_warning(text):
    print(f"⚠️ WARNING: {text}")

def get_system_info():
    """Get system information"""
    print_header("SYSTEM INFORMATION")
    print_info("Platform", platform.platform())
    print_info("Python Version", sys.version)
    print_info("pymongo Version", pymongo.__version__)
    print_info("SSL Version", ssl.OPENSSL_VERSION)
    print_info("Certifi", certifi.__version__)
    
    # Check if this is running on Render
    if os.environ.get("RENDER"):
        print_info("Environment", "Render.com")
    else:
        print_info("Environment", "Local")

def check_dns_resolution(hostname):
    """Check if we can resolve DNS for the MongoDB host"""
    try:
        print_header(f"DNS RESOLUTION FOR {hostname}")
        ips = socket.gethostbyname_ex(hostname)
        print_success(f"Resolved {hostname} to {ips}")
        return True
    except Exception as e:
        print_error(f"Failed to resolve {hostname}: {str(e)}")
        return False

def check_connection_to_host(hostname, port):
    """Check if we can connect to the host and port"""
    try:
        print_header(f"TCP CONNECTION TEST TO {hostname}:{port}")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(5)
        result = sock.connect_ex((hostname, port))
        
        if result == 0:
            print_success(f"Connected to {hostname}:{port}")
            sock.close()
            return True
        else:
            print_error(f"Could not connect to {hostname}:{port}, error code: {result}")
            return False
    except Exception as e:
        print_error(f"Error connecting to {hostname}:{port}: {str(e)}")
        return False

async def test_mongodb_connection(uri, options=None):
    """Test connecting to MongoDB"""
    print_header("MONGODB CONNECTION TEST")
    
    if not uri:
        print_error("No MongoDB URI provided. Set the MONGO_URI environment variable.")
        return False
    
    # If the URI is provided but password is masked, warn the user
    if "****" in uri:
        print_warning("URI contains masked password. Replace with actual password for testing.")
    
    try:
        # Parse the URI to extract host for connectivity testing
        if uri.startswith("mongodb+srv://"):
            # SRV format
            parts = uri.split('@')
            if len(parts) > 1:
                hostname = parts[1].split('/')[0]
                check_dns_resolution(hostname)
        elif uri.startswith("mongodb://"):
            # Standard format
            parts = uri.split('@')
            if len(parts) > 1:
                host_port = parts[1].split('/')[0]
                if ':' in host_port:
                    hostname, port_str = host_port.split(':')
                    port = int(port_str)
                    check_connection_to_host(hostname, port)
                else:
                    check_dns_resolution(host_port)
                    check_connection_to_host(host_port, 27017)
        
        # Create MongoDB client with options
        conn_options = {
            'serverSelectionTimeoutMS': 10000,
            'connectTimeoutMS': 10000,
            'ssl': True,
            'ssl_cert_reqs': ssl.CERT_NONE,
            'retryWrites': False,
            'tls': True,
            'tlsAllowInvalidCertificates': True
        }
        
        # Update with user options if provided
        if options:
            conn_options.update(options)
        
        # Print connection options
        print("\nConnection options:")
        for key, value in conn_options.items():
            print(f"  {key}: {value}")
        
        print("\nAttempting MongoDB connection...")
        client = AsyncIOMotorClient(uri, **conn_options)
        
        # Force a connection to verify it works
        await client.admin.command('ping')
        
        print_success("Successfully connected to MongoDB!")
        
        # Get server info
        server_info = await client.admin.command('serverStatus')
        version = server_info.get('version', 'unknown')
        print_info("MongoDB Version", version)
        
        # Get database name from URI
        if '/' in uri:
            db_name = uri.split('/')[-1].split('?')[0]
            if db_name:
                print_info("Database", db_name)
                # Test accessing the database
                db = client[db_name]
                collections = await db.list_collection_names()
                print_info("Collections", ", ".join(collections) if collections else "None")
        
        await client.close()
        return True
    except Exception as e:
        print_error(f"MongoDB connection error: {str(e)}")
        
        # Additional diagnostic info for common errors
        error_str = str(e)
        if 'SSL' in error_str or 'TLS' in error_str:
            print("\nThis appears to be an SSL/TLS error. Try the following:")
            print("1. Check if your MongoDB Atlas requires TLS 1.2+")
            print("2. Ensure your IP is whitelisted in MongoDB Atlas")
            print("3. Verify you're using the latest connection string format")
            print("4. Try a different MongoDB driver version")
        elif 'authentication failed' in error_str.lower():
            print("\nThis appears to be an authentication error. Check your credentials.")
            print("1. Verify username and password in connection string")
            print("2. Make sure the user has the correct permissions")
            print("3. Check if username/password need URL encoding")
        elif 'getaddrinfo failed' in error_str.lower() or 'nodename nor servname' in error_str.lower():
            print("\nThis appears to be a DNS resolution error.")
            print("1. Check if the hostname in your connection string is correct")
            print("2. Ensure you have proper network connectivity")
            print("3. Try using IP address instead of hostname temporarily")
        
        return False

async def main():
    """Main diagnostic function"""
    print_header("MONGODB CONNECTION DIAGNOSTIC")
    print("This tool helps diagnose MongoDB connection issues on Render.com")
    
    # Get system information
    get_system_info()
    
    # Get MongoDB URI
    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        print_warning("MONGO_URI environment variable not set. Using default.")
        mongo_uri = input("Enter MongoDB URI (or press enter to skip): ")
    
    if mongo_uri:
        # Mask the password in logs
        masked_uri = mongo_uri
        if '@' in masked_uri and ':' in masked_uri.split('@')[0]:
            user_part = masked_uri.split('@')[0]
            user = user_part.split(':')[0].replace('mongodb://', '').replace('mongodb+srv://', '')
            masked_uri = masked_uri.replace(user_part, f"{user}:****")
        print_info("Testing connection to", masked_uri)
        
        # Test MongoDB connection
        success = await test_mongodb_connection(mongo_uri)
        
        if success:
            print_header("DIAGNOSIS SUMMARY")
            print_success("MongoDB connection is working correctly!")
            print("\nYou can safely deploy your application.")
        else:
            print_header("DIAGNOSIS SUMMARY")
            print_error("MongoDB connection failed.")
            print("\nReview the errors above and try the suggested fixes.")
            print("For more help, see the troubleshooting section in DEPLOYMENT.md")
    else:
        print_error("No MongoDB URI provided. Cannot perform connection test.")

if __name__ == "__main__":
    asyncio.run(main()) 