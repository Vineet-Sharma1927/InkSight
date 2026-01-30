# Demo Mode & Auto-Login Feature

## Overview
The website now supports automatic login for recruiters and demo users, eliminating the need for sign-up when sharing the link.

## Demo Credentials
When demo mode is enabled, users will automatically log in with these credentials:
- **Email:** vineet11vinu@gmail.com
- **Password:** vineet@1821

## How It Works

### 1. **Login Page Pre-fills Credentials**
The login page automatically pre-fills both email and password fields with the demo account credentials, so users can simply click "Log In" without typing.

### 2. **Auto-Login in Production**
When `NEXT_PUBLIC_DEMO_MODE=true`, the application automatically logs in the demo account when a user first visits the website, bypassing the login page entirely.

## Environment Configuration

### Development Mode (`.env.local`)
```
NEXT_PUBLIC_DEMO_MODE=false
```
Users see the login page and can manually enter credentials or sign up.

### Production Mode (`.env.production`)
```
NEXT_PUBLIC_DEMO_MODE=true
```
Recruiters are automatically logged in and can immediately see the data.

## How to Enable/Disable

### For Development/Testing:
```bash
npm run dev  # Uses .env.local (NEXT_PUBLIC_DEMO_MODE=false)
```

### For Production Build:
```bash
npm run build  # Uses .env.production (NEXT_PUBLIC_DEMO_MODE=true)
npm run start
```

## Implementation Details

### Modified Files:

1. **app/components/AuthProvider.js**
   - Added logic to auto-login with demo credentials when `NEXT_PUBLIC_DEMO_MODE=true`
   - Checks if user is not already authenticated before attempting login

2. **app/login/page.js**
   - Pre-fills email and password fields with demo credentials
   - Users can see the credentials and click login, or edit them if needed

3. **.env.local** (Development)
   - Demo mode disabled for normal development workflow

4. **.env.production** (Production)
   - Demo mode enabled for recruiter demonstrations

## Features

✅ **Pre-filled Login Form** - No need to type credentials
✅ **Auto-Login in Production** - Opens directly to data dashboard
✅ **Environment-Based** - Different behavior for dev vs production
✅ **No Signup Required** - Recruiters see data immediately
✅ **Easy Toggle** - Just change environment variable to enable/disable

## Security Note

⚠️ **Important**: This demo mode is designed for temporary demonstration purposes. For long-term production with sensitive data, consider:
- Using a separate demo account with limited data access
- Resetting demo data regularly
- Adding a banner indicating "Demo Mode" is active
- Implementing role-based access control to limit data visibility
- Using a different authentication mechanism for actual users
