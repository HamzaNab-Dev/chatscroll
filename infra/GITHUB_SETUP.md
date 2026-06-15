# GitHub Repository Setup

## Step 1: Create Public GitHub Repo

The hackathon requires a **public** repository for judges to review.

1. Go to github.com → New repository
2. Name: `chatscroll`
3. Visibility: **Public** ⚠️ Required by hackathon rules
4. Don't initialize (we already have code)
5. Create repository

## Step 2: Push Code

```bash
# From chatscroll/ root
git remote add origin https://github.com/HamzaNab-Dev/chatscroll.git
git branch -M main
git push -u origin main
```

## Step 3: Verify .gitignore

Make sure these are NOT committed:
- ❌ `appsettings.Development.json` (has local DB credentials)
- ❌ `.env.local` (has API URLs)
- ❌ Any file containing AWS credentials

## Step 4: Connect Vercel to GitHub

1. vercel.com → New Project
2. Import from GitHub → select `chatscroll`
3. Root directory: `frontend/chatscroll-web`
4. Framework: Next.js (auto-detected)
5. Add environment variables (from `infra/AWS_SETUP.md` Step 9)
6. Deploy → note your Vercel URL: `https://chatscroll-xxx.vercel.app`
