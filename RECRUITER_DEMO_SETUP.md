# Quick Setup Guide for Production Demo

## Step 1: Verify Account Exists
Ensure the demo account exists in Firebase:
- **Email:** vineet11vinu@gmail.com
- **Password:** vineet@1821

If the account doesn't exist, create it in Firebase Console or via signup.

## Step 2: Build for Production
```bash
npm run build
npm run start
```

When you start the server, it will automatically use `.env.production` which has `NEXT_PUBLIC_DEMO_MODE=true`.

## Step 3: Share the Link
Now when you send the link to recruiters:
- They open the website → Auto-logged in ✓
- They see the patient data immediately ✓
- No signup required ✓

## Step 4: For Local Testing
If you want to test with demo mode OFF locally:
```bash
npm run dev  # Uses .env.local with NEXT_PUBLIC_DEMO_MODE=false
```

If you want to test with demo mode ON locally:
1. Temporarily change `.env.local`:
```
NEXT_PUBLIC_DEMO_MODE=true
```
2. Run: `npm run dev`
3. Don't forget to change it back to `false` when done

## Current Configuration

| Environment | File | NEXT_PUBLIC_DEMO_MODE | Behavior |
|-------------|------|----------------------|----------|
| Development | .env.local | false | Manual login required |
| Production | .env.production | true | Auto-login enabled |

## Features Enabled
✅ Login form pre-fills credentials
✅ Auto-login on page load (production only)
✅ Recruiters see data immediately
✅ No signup required

## Troubleshooting

**Issue:** Not auto-logging in on production
- Check if `NEXT_PUBLIC_DEMO_MODE=true` in `.env.production`
- Verify demo account exists in Firebase
- Check browser console for any auth errors

**Issue:** Don't want auto-login in production
- Change `NEXT_PUBLIC_DEMO_MODE=false` in `.env.production`
- Rebuild: `npm run build`

**Issue:** Manual login not working
- Verify email/password are correct
- Check Firebase console for account status
- Clear browser cache and try again
