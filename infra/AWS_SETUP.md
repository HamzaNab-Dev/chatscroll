# ChatScroll AWS Infrastructure Setup
## Complete Step-by-Step Guide

---

## Prerequisites
- AWS account created ✅
- AWS credits applied to account ✅

---

## Step 1: Enable Amazon Bedrock Models

1. Go to AWS Console → search "Bedrock"
2. Make sure you're in **us-east-1** region (top right)
3. Left sidebar → "Model access"
4. Click "Manage model access"
5. Check these models:
   - ✅ Anthropic → Claude Sonnet (claude-sonnet-4-6)
   - ✅ Amazon → Titan Embeddings V2
6. Click "Save changes"
7. Wait 2-5 minutes for approval (usually instant)

---

## Step 2: Create Aurora PostgreSQL Serverless v2

1. Go to AWS Console → RDS
2. Click "Create database"
3. Settings:
   - Engine: **Aurora (PostgreSQL Compatible)**
   - Template: **Dev/Test**
   - DB cluster identifier: `chatscroll-aurora`
   - Master username: `chatscroll_admin`
   - Master password: Create strong password, **SAVE IT**
   - DB instance class: **Serverless v2**
   - Min ACU: **0.5**
   - Max ACU: **4**
   - VPC: Default VPC
   - Public access: **YES**
   - VPC security group: Create new → name: `chatscroll-aurora-sg`
   - Initial database name: `chatscroll`
4. Click "Create database" — wait ~5 minutes

5. After creation, get the **Writer endpoint**:
   - Click your cluster → "Connectivity & security"
   - Copy: `chatscroll-aurora.cluster-xxx.us-east-1.rds.amazonaws.com`

6. Fix Security Group to allow connections:
   - EC2 → Security Groups → `chatscroll-aurora-sg`
   - Inbound rules → Edit → Add rule:
     - Type: PostgreSQL | Port: 5432 | Source: Anywhere IPv4
   - Save rules

7. Connection string:
```
Host=chatscroll-aurora.cluster-xxx.us-east-1.rds.amazonaws.com;Port=5432;Database=chatscroll;Username=chatscroll_admin;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true
```

---

## Step 3: Apply Aurora Schema

Using psql or DBeaver, connect to your cluster and run:

```bash
psql "postgresql://chatscroll_admin:YOUR_PASSWORD@YOUR_AURORA_ENDPOINT:5432/chatscroll?sslmode=require" -f infra/schema.sql
```

---

## Step 4: Create Cognito User Pool

Follow `infra/COGNITO_SETUP.md`.

After creating, note:
- User Pool ID: `us-east-1_XXXXXXXXX`
- Client ID: `XXXXXXXXXXXXXXXXXXXXXXXXXX`

---

## Step 5: Create IAM Role for App Runner

1. IAM → Roles → Create role
2. Trusted entity: **AWS service** → App Runner
3. Permissions:
   - `AmazonBedrockFullAccess`
   - `AmazonDynamoDBFullAccess`
   - `AmazonCognitoReadOnly`
4. Role name: `chatscroll-apprunner-role`
5. Note the Role ARN

---

## Step 6: Build and Push Docker Image to ECR

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name chatscroll-api \
  --region us-east-1

# Login to ECR (replace YOUR_ACCOUNT_ID)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS \
  --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build image (from chatscroll/backend/)
docker build -t chatscroll-api .

# Tag
docker tag chatscroll-api:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chatscroll-api:latest

# Push
docker push \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/chatscroll-api:latest
```

---

## Step 7: Deploy to AWS App Runner

1. AWS Console → App Runner → "Create service"
2. Source:
   - Repository type: **Container registry** → Amazon ECR
   - Container image URI: your ECR URI
   - Deployment trigger: Manual
3. Settings:
   - Service name: `chatscroll-api`
   - CPU: 1 vCPU | Memory: 2 GB | Port: **8080**
4. Environment variables:

| Key | Value |
|-----|-------|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ConnectionStrings__Aurora` | your Aurora connection string |
| `AWS__Region` | `us-east-1` |
| `AWS__CognitoUserPoolId` | your pool id |
| `AWS__CognitoClientId` | your client id |
| `VERCEL_FRONTEND_URL` | `https://chatscroll.vercel.app` |

5. Security → Instance role: `chatscroll-apprunner-role`
6. Create & deploy — wait ~3 minutes
7. Note the App Runner URL: `https://XXXXX.us-east-1.awsapprunner.com`

---

## Step 8: Integrate aws-amplify in Frontend (Cognito sign-in)

```bash
cd frontend/chatscroll-web
npm install aws-amplify
```

Then update `src/context/AuthContext.tsx` — replace the Phase 6 TODO stubs:

```typescript
// signIn (replace throw with):
const { Amplify } = await import('aws-amplify');
const { signIn: amplifySignIn, fetchAuthSession } = await import('aws-amplify/auth');
Amplify.configure({
  Auth: { Cognito: { userPoolId: cognitoConfig.userPoolId, userPoolClientId: cognitoConfig.userPoolClientId } }
});
await amplifySignIn({ username: email, password });
const session = await fetchAuthSession();
const token = session.tokens?.idToken?.toString();
const payload = session.tokens?.idToken?.payload ?? {};
const user: AuthUser = {
  id: String(payload.sub ?? ''),
  email: String(payload.email ?? email),
  displayName: String(payload.name ?? email.split('@')[0]),
  plan: 'free',
  token,
};
localStorage.setItem('chatscroll_user', JSON.stringify(user));
setAuthState({ status: 'authenticated', user });
```

---

## Step 9: Deploy Frontend to Vercel

1. Push code to GitHub (see `infra/GITHUB_SETUP.md`)
2. vercel.com → New Project → Import from GitHub
3. Root directory: `frontend/chatscroll-web`
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = `https://YOUR_APP_RUNNER_URL`
   - `NEXT_PUBLIC_AWS_REGION` = `us-east-1`
   - `NEXT_PUBLIC_COGNITO_USER_POOL_ID` = your pool id
   - `NEXT_PUBLIC_COGNITO_CLIENT_ID` = your client id
5. Deploy → note Vercel URL

6. Update App Runner env var `VERCEL_FRONTEND_URL` to your actual Vercel URL
7. Redeploy App Runner service

---

## Step 3b: Apply pgvector Dimension Fix (→ 3072)

`gemini-embedding-001` produces **3072-dimensional** vectors.
Run this against your Aurora cluster **once** (or after any prior ALTER that set a different size):

```sql
-- Change embedding columns to 3072-dim (matches gemini-embedding-001)
ALTER TABLE notes ALTER COLUMN embedding TYPE vector(3072);
ALTER TABLE question_history ALTER COLUMN question_embedding TYPE vector(3072);

-- Drop and recreate the IVFFlat indexes for the new dimension
DROP INDEX IF EXISTS idx_notes_embedding;
DROP INDEX IF EXISTS notes_embedding_idx;
CREATE INDEX idx_notes_embedding ON notes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## Step 3c: Create DynamoDB Table (chatscroll-messages)

Run once with a user/role that has DynamoDB full access:

```bash
aws dynamodb create-table \
  --table-name chatscroll-messages \
  --attribute-definitions \
      AttributeName=conversationId,AttributeType=S \
      AttributeName=timestamp,AttributeType=S \
  --key-schema \
      AttributeName=conversationId,KeyType=HASH \
      AttributeName=timestamp,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Enable TTL (90-day auto-expiry on the 'ttl' attribute)
aws dynamodb update-time-to-live \
  --table-name chatscroll-messages \
  --time-to-live-specification Enabled=true,AttributeName=ttl \
  --region us-east-1
```

Verify:
```bash
aws dynamodb describe-table --table-name chatscroll-messages --region us-east-1 \
  --query 'Table.{Status:TableStatus,TTL:TimeToLiveDescription}'
```

---

## Step 7b: ECS Environment Variables (real Aurora + DynamoDB)

When deploying via ECS (GitHub Actions → ECR → ECS), set these environment variables
on the ECS task definition in addition to what's in Step 7:

| Key | Value |
|-----|-------|
| `ConnectionStrings__Aurora` | `Host=chatscroll-aurora.cluster-xxx.us-east-1.rds.amazonaws.com;Port=5432;Database=chatscroll;Username=chatscroll_admin;Password=YOUR_PASSWORD;SSL Mode=Require;Trust Server Certificate=true` |
| `GEMINI_API_KEY` | your Gemini API key |
| `ASPNETCORE_ENVIRONMENT` | `Production` |

The ECS task role needs:
- `AmazonDynamoDBFullAccess` — lets the container call DynamoDB without explicit credentials
- `SecretsManagerReadWrite` — optional, for fetching secrets at runtime

Smart-switch behaviour (no code change needed):
- `ConnectionStrings__Aurora` set → Aurora PostgreSQL repos registered
- `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI` set (automatic on ECS) → real DynamoDB registered
- Neither set → all Mock repos (safe for local `dotnet run`)

---

## Step 10: Screenshots for Submission

1. ✅ RDS → your Aurora cluster
2. ✅ App Runner → your service (showing "Running")
3. ✅ Bedrock → Model access (Claude + Titan checked)
4. ✅ Vercel → your project dashboard
