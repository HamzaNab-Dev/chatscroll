# Bonus Content Templates (+0.6 points)

Each piece must include: **"I created this for the H0 Hackathon"** + **#H0Hackathon**

---

## Content Piece 1 — dev.to Blog Post (+0.2)

**Title:** How I built a personal AI knowledge base with Aurora PostgreSQL and pgvector

**Outline:**

1. **The problem**: Every time you get a great answer from AI, it disappears into chat history. After 200 conversations, your knowledge is inaccessible.

2. **The solution**: ChatScroll — a split-panel app where you chat on the left and your knowledge tree grows on the right.

3. **Why Aurora PostgreSQL?**
   - `ltree` extension: hierarchical folder paths like `programming.dotnet.ef_core`
   - `pgvector` extension: 1024-dimension embeddings for semantic search
   - `tsvector` + `pg_trgm`: full-text and fuzzy search built into the DB
   - Serverless v2: scales to zero cost when idle

4. **Amazon Bedrock integration**
   - Claude Sonnet 4.6 for chat, folder suggestions, and note rewriting
   - Titan Embeddings v2 for generating the 1024-dimension vectors
   - Smart fallback to mock services when credentials unavailable

5. **The "already know this" detector**: Before Claude answers, we search Aurora for semantically similar notes using cosine similarity on pgvector embeddings.

6. **Lessons learned**: Aurora's ltree + pgvector combination is genuinely powerful for knowledge management. The combination of hierarchical structure and semantic search is hard to replicate elsewhere.

**Footer:** I created this content as part of my submission to the H0 Hackathon. #H0Hackathon

---

## Content Piece 2 — LinkedIn Post (+0.2)

```
🚀 Excited to share ChatScroll — a personal AI knowledge management
app I built for the #H0Hackathon!

The core insight: every time you ask Claude something valuable,
that knowledge dies in your chat history. ChatScroll fixes this by
automatically organizing every AI answer into a searchable personal
knowledge tree.

Built with:
🗄️ Amazon Aurora PostgreSQL Serverless v2
   → pgvector for semantic search
   → ltree for hierarchical folders
   → tsvector for full-text search
🤖 Amazon Bedrock — Claude Sonnet 4.6 + Titan Embeddings
⚡ .NET 9 + Next.js 16 deployed on AWS App Runner + Vercel

The most interesting challenge: using Aurora's pgvector to detect
when you're about to research something you've already saved —
preventing duplicate work before you even ask the question.

Live demo: [your Vercel URL]
GitHub: [your GitHub URL]

I created this content as part of my submission to the H0 Hackathon.
#H0Hackathon #AWS #Aurora #Vercel #BuildInPublic #dotnet #nextjs
```

---

## Content Piece 3 — YouTube Video (+0.2)

**Title:** Building ChatScroll — Personal AI Knowledge Base with Aurora PostgreSQL | H0 Hackathon

**Description:**
```
In this video I walk through ChatScroll — a personal AI knowledge
management app built for the AWS H0 Hackathon.

I cover:
⏱️ 0:00 — The problem: AI knowledge that disappears
⏱️ 0:40 — Demo: asking questions and saving notes
⏱️ 1:30 — The knowledge tree and semantic search
⏱️ 2:10 — AWS architecture: Aurora, Bedrock, Cognito, App Runner
⏱️ 2:40 — Wrap-up

Tech used:
• Amazon Aurora PostgreSQL Serverless v2 (pgvector + ltree)
• Amazon Bedrock (Claude Sonnet 4.6 + Titan Embeddings)
• AWS App Runner (.NET 9 backend)
• AWS Cognito (authentication)
• Vercel (Next.js 16 frontend)

Live app: [your Vercel URL]
GitHub: [your GitHub URL]

I created this content as part of my submission to the H0 Hackathon.
#H0Hackathon #AWS #Aurora #Vercel
```
