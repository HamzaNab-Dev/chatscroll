# ChatScroll — Hackathon Submission Checklist
## Deadline: June 29, 2026 @ 5:00pm PT (June 30 @ 3:00am GMT+3)

---

## ✅ App is Live

- [ ] Backend running at App Runner URL — `GET /api/health` returns 200
- [ ] Frontend running at Vercel URL — loads without errors
- [ ] Can sign up with real email (Cognito)
- [ ] Can log in
- [ ] Can chat with real Claude AI (not mock — check `/api/chat/ai-status`)
- [ ] Can save notes to Aurora (real DB, not mock)
- [ ] Knowledge tree loads folders and notes from Aurora
- [ ] Search returns results

---

## ✅ Required Submission Items

- [ ] **Text description** — see template below, written and ready
- [ ] **Demo video** — uploaded to YouTube (under 3 minutes, see script below)
- [ ] **Vercel project URL** — live and accessible to judges
- [ ] **Vercel Team ID** — copied from Vercel settings → General → Team ID
- [ ] **Architecture diagram** — exported as PNG, saved to `docs/architecture.png`
- [ ] **AWS screenshot** — Aurora cluster in AWS Console
- [ ] **DB names stated in description** — Aurora PostgreSQL + DynamoDB

---

## ✅ Bonus Points (max +0.6)

- [ ] Blog post 1 on dev.to (+0.2) — see `infra/BONUS_CONTENT.md`
- [ ] Blog post 2 on LinkedIn (+0.2) — see `infra/BONUS_CONTENT.md`
- [ ] YouTube video (+0.2) — see `infra/BONUS_CONTENT.md`
- [ ] All posts include: "I created this for the H0 Hackathon" + `#H0Hackathon`

---

## 📝 Text Description Template

```
ChatScroll — Every question becomes lasting knowledge

ChatScroll is a personal AI knowledge management web application
that turns every AI conversation into permanent, organized,
searchable knowledge.

AWS Databases Used:
- Amazon Aurora PostgreSQL Serverless v2 (PRIMARY) — stores all
  user data, folders, notes, and semantic embeddings using:
  pgvector (semantic search), ltree (hierarchical folders),
  tsvector (full-text search), pg_trgm (fuzzy matching)
- Amazon DynamoDB — stores raw chat message logs with TTL-based
  auto-cleanup

How it works:
1. User asks any question in the chat interface
2. Amazon Bedrock (Claude Sonnet 4.6) answers the question
3. AI automatically suggests which folder to save the answer in
4. AI rewrites the answer as a clean, evergreen knowledge note
5. Note is saved to Aurora PostgreSQL with vector embeddings
6. User can search all saved knowledge semantically

Key Features:
- AI-suggested folder organization using Aurora ltree paths
- Semantic search using pgvector + Titan Embeddings
- "You already know this" detector (prevents duplicate research)
- Cross-domain knowledge: programming, medicine, recipes, anything
- Beautiful split-panel UI — chat left, knowledge tree right

Tech Stack:
- Frontend: Next.js 16 + React 19 + Tailwind CSS + shadcn/ui (Vercel)
- Backend: .NET 9 Web API (AWS App Runner)
- Primary DB: Aurora PostgreSQL Serverless v2 (pgvector, ltree, tsvector)
- Secondary DB: Amazon DynamoDB (chat logs)
- AI: Amazon Bedrock — Claude Sonnet 4.6 + Titan Embeddings v2
- Auth: AWS Cognito
- Track: Open Innovation (Track 4)
```

---

## 🎬 Demo Video Script (Under 3 Minutes)

### Scene 1 — Hook (0:00–0:20)
"Every developer has asked the same question twice. Every student has forgotten what they just learned. ChatScroll fixes that."

### Scene 2 — The Problem (0:20–0:40)
Show: ChatGPT with many conversations. "Your knowledge is buried here. You'll never find it again."

### Scene 3 — The Solution (0:40–1:30)
Show live ChatScroll:
- Type: "What are SOLID principles?"
- AI answers with Claude
- SaveNoteModal appears: "Save to Programming → .NET?"
- Click Save → "✅ Saved to knowledge tree"

### Scene 4 — The Magic (1:30–2:10)
- Open Knowledge Tree → Programming folder → see the note
- Click note → beautiful formatted viewer
- Ask: "How do SOLID principles relate to dependency injection?"
- "💡 You've saved something similar before!" banner appears

### Scene 5 — The AWS Stack (2:10–2:40)
Show AWS Console briefly:
- Aurora PostgreSQL cluster running
- Bedrock model access showing Claude enabled
- "Our notes are stored with pgvector for semantic search and ltree for hierarchical folders"

### Scene 6 — Close (2:40–3:00)
"ChatScroll — built with Aurora PostgreSQL, Amazon Bedrock, AWS Cognito, and Vercel. Every question becomes lasting knowledge."

---

## 🏗️ Architecture Diagram

Open [draw.io](https://app.diagrams.net) and create:

```
[User Browser]
      ↓ HTTPS
[Vercel — Next.js 16]
      ↓ REST API (HTTPS)
[AWS App Runner — .NET 9]
      ↓              ↓              ↓              ↓
[Aurora PG]    [DynamoDB]    [Bedrock]      [Cognito]
pgvector       Chat Logs     Claude 4.6     JWT Auth
ltree          TTL 90d       Titan Embed
tsvector
```

Use AWS official icons: https://aws.amazon.com/architecture/icons/
Export as PNG → save as `docs/architecture.png`
