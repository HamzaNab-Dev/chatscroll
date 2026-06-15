# AWS Cognito Setup for ChatScroll

## Step 1: Create User Pool

1. Go to AWS Console → Cognito → User Pools
2. Click "Create user pool"
3. Configure sign-in:
   - Sign-in options: **Email**
   - Click Next
4. Password policy: Cognito defaults (min 8 chars)
5. MFA: **No MFA** (for hackathon)
6. User account recovery: Email only
7. Self-registration: **Enable**
8. Required attributes: `email`, `name`
9. Email: Send email with Cognito (free tier)
10. User pool name: `chatscroll-users`
11. App client name: `chatscroll-web`
12. Client secret: **NO** (uncheck — not needed for web app)
13. Create user pool

## Step 2: Get Your IDs

After creation, note:
- **User Pool ID**: `us-east-1_XXXXXXXXX`
- **Client ID**: `XXXXXXXXXXXXXXXXXXXXXXXXXX`

## Step 3: Add to Environment Variables

### Frontend (`frontend/chatscroll-web/.env.local`):
```
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Backend (`backend/src/ChatScroll.Api/appsettings.Development.json`):
```json
{
  "AWS": {
    "CognitoUserPoolId": "us-east-1_XXXXXXXXX",
    "CognitoClientId": "XXXXXXXXXXXXXXXXXXXXXXXXXX"
  }
}
```

## Step 4: Install aws-amplify in Frontend (Phase 6)

```bash
cd frontend/chatscroll-web
npm install aws-amplify
```

Then integrate v6 auth calls in `src/context/AuthContext.tsx` where the Phase 6 TODOs are marked.

## Step 5: Test

1. Restart both frontend and backend
2. Go to http://localhost:3000/login
3. Sign up with a real email
4. Check email for verification code
5. Verify and sign in
6. Should redirect to main app
