# 📜 ChatScroll — Every Question Becomes Lasting Knowledge

> Your personal AI knowledge library — chat, save, organize, and search your knowledge forever.

**[🌐 Live Demo](https://chatscroll.vercel.app) · [🏗️ AWS Architecture](https://chatscroll.vercel.app/aws-showcase) · [🏆 AWS H0 Hackathon 2026](https://h01.devpost.com)**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![ASP.NET Core](https://img.shields.io/badge/ASP.NET_Core-9-purple?style=flat-square&logo=dotnet)
![Aurora PostgreSQL](https://img.shields.io/badge/Aurora-PostgreSQL-orange?style=flat-square&logo=amazon-aws)
![DynamoDB](https://img.shields.io/badge/DynamoDB-AWS-orange?style=flat-square&logo=amazon-dynamodb)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)

---

## 🧪 Try It Now — Judges & Testers

**Live app:** https://chatscroll.vercel.app

1. **Register a free account**
   - Click "Sign In" → "Sign Up" tab
   - Enter your name, email and password
   - Verify with the 6-digit code sent to your inbox
   - ⚠️ If you don't see the email, check your spam/junk folder

2. **Start chatting**
   - Ask any question in the chat
   - Click "Save as Scroll" to save the best answer
   - AI will automatically suggest the right folder

3. **Explore your Library**
   - Go to /library
   - Try Smart search: type "blood thinner" to find the warfarin scroll by meaning not keywords
   - Try Study Mode, Share, Write your own Scroll

4. **View AWS Architecture**
   - https://chatscroll.vercel.app/aws-showcase

> All data is real — Aurora PostgreSQL + DynamoDB, no mocks or stubs in production.

---

## 🧠 What is ChatScroll?

Every day people ask AI assistants valuable questions and get great answers — then lose them forever. Chat history is linear, unsearchable, and ephemeral.

**ChatScroll fixes that.**

Chat with Gemini AI, save the best answers as **Scrolls**, and build a personal knowledge library that grows smarter over time — organized automatically, searchable semantically, and yours forever.

---

## ✨ Features

### 💬 AI Chat
- Powered by **Google Gemini 2.5 Flash**
- Multi-turn conversation with persistent history
- Conversations saved to **Amazon DynamoDB** with 90-day TTL

### 📜 Save as Scroll
- Save any AI answer with one click
- AI automatically suggests the right folder based on topic
- Anonymous users can save Scrolls before signing up — data migrates on registration

### 🔍 Smart Semantic Search
- **pgvector** cosine similarity search with 3072-dimensional embeddings
- Find "blood thinner medication" → discovers your warfarin Scroll
- Results scoped to same folder category — no cross-topic contamination
- Hybrid search: semantic + full-text (tsvector) combined
- Ranking badges: ✦ #1 Match, ✦ #2 Match, ✦ #3 Match

### 📁 Hierarchical Folder Organization
- AI auto-organizes Scrolls into folders like `Programming → Docker`
- **ltree** extension for path-based folder hierarchy
- Parent/child folder structure with toggle to show/hide subfolders

### 🎓 Study Mode
- Review your Scroll library as flashcards
- Keyboard navigation: Space to flip, ← → to navigate, Esc to exit
- Progress bar and restart button

### ✍️ Write Your Own Scrolls
- Create Scrolls from books, articles, or your own knowledge
- Not limited to AI answers — any knowledge source works

### 🔗 Share & Import
- Share any Scroll via public link
- Anyone can import a shared Scroll to their own library

### 📊 Related Scrolls
- pgvector nearest-neighbour search scoped to same folder subtree
- Automatically surfaces semantically similar Scrolls

### 📤 Export
- Browser-native PDF export (print-to-PDF)
- Markdown export for portability

---

## 🗄️ AWS Database Architecture

ChatScroll uses **two AWS databases** — deliberately chosen for different data characteristics.

### Amazon Aurora PostgreSQL — The Knowledge Layer

Aurora Serverless v2 with three PostgreSQL extensions working together:

| Extension | What it's used for |
|-----------|-------------------|
| **pgvector** | 3072-dim embeddings via `gemini-embedding-001`; cosine similarity search; Related Scrolls via nearest-neighbour scoped to folder subtree |
| **ltree** | Folder paths as dot-separated label trees (`programming.containers`); subtree queries without recursive CTEs |
| **tsvector** | Full-text search index; ranked with `ts_rank`; hybrid search combining semantic + keyword results |

**Aurora stores:** Scrolls, folders, users (Cognito sub), conversation metadata

```sql
-- Semantic search with threshold
WHERE 1 - (embedding <=> $queryVec) > 0.5
ORDER BY embedding <=> $queryVec
LIMIT 5

-- Folder subtree query (ltree)
WHERE path ~ 'programming.*'

-- Full-text search
WHERE search_vector @@ plainto_tsquery('english', $q)
ORDER BY ts_rank(search_vector, ...) DESC
```

### Amazon DynamoDB — The Chat Layer

DynamoDB stores the high-volume chat message stream:

| Key | Value |
|-----|-------|
| **PK** | `conversationId` (String) |
| **SK** | `{timestamp}#{messageId}` (String) |
| **TTL** | `expiresAt` (Unix epoch, 90 days) |
| **Capacity** | PAY_PER_REQUEST |

- Chronological reads and time-range queries via composite sort key
- 90-day TTL auto-expires messages — zero infrastructure, no cron jobs
- Scales to millions of messages with pay-per-request billing

**Aurora owns structure and search. DynamoDB owns the message stream.**

---

## 🏗️ System Architecture

```
+------------------+     +--------------------------------------+
|   Browser /      |     |           AWS Cloud                  |
|   Mobile         |     |                                      |
|                  |     |  +------------+   +--------------+   |
|   Next.js 14     |<--->|  | AWS ECS    |   |  AWS Cognito |   |
|   Vercel         |     |  | Fargate    |   |  JWT Auth    |   |
+------------------+     |  | ASP.NET 9  |   +--------------+   |
                         |  +-----+------+                      |
+------------------+     |        |                             |
| GitHub Actions   |---->|  +-----v------+   +--------------+   |
| CI/CD Pipeline   | ECR |  |   Aurora   |   |  DynamoDB    |   |
+------------------+     |  | PostgreSQL |   |  chatscroll  |   |
                         |  | pgvector   |   |  -messages   |   |
+------------------+     |  | ltree      |   |  TTL 90d     |   |
| Google Gemini    |<--->|  | tsvector   |   |  PAY_PER_    |   |
| 2.5 Flash        |     |  +------------+   |  REQUEST     |   |
| embedding-001    |     |                   +--------------+   |
+------------------+     +--------------------------------------+
```

**CI/CD Pipeline:**
```
git push → GitHub Actions → docker build → ECR push → ECS deploy → ✅ live
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- .NET 9 SDK
- Docker (for local backend)
- AWS Account with Aurora PostgreSQL and DynamoDB

### 1. Clone the repository
```bash
git clone https://github.com/HamzaNab-Dev/chatscroll.git
cd chatscroll
```

### 2. Configure the Backend
```bash
cd backend/src/ChatScroll.Api
```

Create `appsettings.Development.json`:
```json
{
  "ConnectionStrings": {
    "Aurora": "Host=...;Port=5432;Database=chatscroll;Username=postgres;Password=...;SSL Mode=Require;Trust Server Certificate=true"
  },
  "Gemini": {
    "ApiKey": "your-gemini-api-key"
  },
  "AWS": {
    "Region": "us-east-1"
  },
  "CognitoUserPoolId": "us-east-1_xxxxxxxx",
  "CognitoClientId": "your-client-id"
}
```

### 3. Run the Backend
```bash
cd backend
dotnet run --project src/ChatScroll.Api
# API available at http://localhost:5001
```

### 4. Configure the Frontend
```bash
cd frontend/chatscroll-web
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
```

### 5. Run the Frontend
```bash
npm install
npm run dev
# App available at http://localhost:3000
```

---

## 🔐 Environment Variables

### Backend — `appsettings.json`
| Key | Description |
|-----|-------------|
| `ConnectionStrings:Aurora` | Aurora PostgreSQL connection string |
| `Gemini:ApiKey` | Google Gemini API key |
| `AWS:Region` | AWS region (us-east-1) |
| `CognitoUserPoolId` | AWS Cognito User Pool ID |
| `CognitoClientId` | AWS Cognito Client ID |

### Frontend — `.env.local`
| Key | Description |
|-----|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito Client ID |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | ASP.NET Core 9, C# |
| Primary DB | Amazon Aurora PostgreSQL Serverless v2 |
| Chat DB | Amazon DynamoDB |
| AI Chat | Google Gemini 2.5 Flash |
| Embeddings | Google gemini-embedding-001 (3072-dim) |
| Auth | AWS Cognito + JWT |
| Container Registry | Amazon ECR |
| Backend Host | AWS ECS Fargate |
| Frontend Host | Vercel |
| CI/CD | GitHub Actions |

---

## ⚠️ Disclaimer

ChatScroll is built for the AWS H0 Hackathon 2026. All AI responses are generated by Gemini AI and may contain errors. Always verify important information from authoritative sources.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ for the **AWS H0 Hackathon 2026** · Monetizable B2C App Track

**Hamza Maher Nabelsi**

🌐 [Live Demo](https://chatscroll.vercel.app) · 🏗️ [AWS Architecture](https://chatscroll.vercel.app/aws-showcase) · 📹 [Demo Video](https://www.youtube.com/watch?v=dp31nq1aPMI)
