# ChatScroll

> Every question becomes lasting knowledge.

ChatScroll is a personal AI knowledge management app that turns every AI conversation into permanent, organized, searchable knowledge. Built for the AWS H0 Hackathon (June 2026).

## Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** .NET 9 Web API, C# 13
- **Database:** Amazon Aurora PostgreSQL Serverless v2 (with pgvector, ltree)
- **Secondary DB:** Amazon DynamoDB
- **AI:** Amazon Bedrock (Claude Sonnet 4.6 + Titan Embeddings)
- **Auth:** AWS Cognito
- **Frontend Host:** Vercel
- **Backend Host:** AWS App Runner

## Quick Start

### Backend
```bash
cd backend
dotnet run --project src/ChatScroll.Api
```
Backend runs at: http://localhost:5001

### Frontend
```bash
cd frontend/chatscroll-web
npm run dev
```
Frontend runs at: http://localhost:3000

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the system architecture.

## License
MIT
