# ChatScroll — Local Development Setup

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| .NET SDK | 9.0+ | [dotnet.microsoft.com](https://dotnet.microsoft.com/download) |
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| Gemini API key | — | Free at [aistudio.google.com](https://aistudio.google.com) |
| PostgreSQL | 15+ (optional) | Only needed for real note persistence; omit to run with in-memory mocks |

---

## Backend Setup

### 1. Configure environment

Open `backend/src/ChatScroll.Api/Properties/launchSettings.json` and replace the placeholder:

```json
"GEMINI_API_KEY": "YOUR_GEMINI_API_KEY_HERE"
```

**Or** copy the template and create a real `appsettings.Development.json`:

```
cp backend/src/ChatScroll.Api/appsettings.Development.template.json \
   backend/src/ChatScroll.Api/appsettings.Development.json
```

Then fill in your values. `appsettings.Development.json` is gitignored — safe to put real credentials there.

### 2. Run the API

```bash
cd backend
dotnet run --project src/ChatScroll.Api
```

API starts at **http://localhost:5001**.  
Swagger UI available at **http://localhost:5001/swagger**.

> **No database?** The app auto-falls back to in-memory mock repositories when `ConnectionStrings__Aurora` is empty. The AI chat feature works fully without PostgreSQL.

### 3. Verify

```
GET http://localhost:5001/api/health          → { status: "ok" }
GET http://localhost:5001/api/health/database → shows which services are real vs mock
GET http://localhost:5001/api/chat/ai-status  → shows which AI service is registered
```

---

## Frontend Setup

### 1. Configure environment

```bash
cd frontend/chatscroll-web
cp .env.template .env.local
```

`.env.local` is gitignored. For local development the defaults in the template are correct as-is — the API URL already points to `localhost:5001`.

### 2. Install dependencies and run

```bash
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**.

---

## AI Service Selection (automatic)

The backend picks the AI service based on which environment variable is set:

| Env var present | Service registered | Model |
|-----------------|--------------------|-------|
| `GEMINI_API_KEY` | `GeminiAiService` | gemini-2.5-flash |
| `ANTHROPIC_API_KEY` | `AnthropicAiService` | claude-opus-4-8 |
| neither | `MockAiService` | hardcoded demo responses |

---

## Quick Start (summary)

```bash
# 1. Backend
#    Edit launchSettings.json → set GEMINI_API_KEY
cd backend && dotnet run --project src/ChatScroll.Api

# 2. Frontend (new terminal)
cd frontend/chatscroll-web
cp .env.template .env.local
npm install && npm run dev

# 3. Open http://localhost:3000
```
