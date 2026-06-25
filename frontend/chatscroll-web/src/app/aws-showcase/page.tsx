import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Database, Zap, Server, GitBranch, Code2, Layers } from "lucide-react";

function Badge({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400">
      <span>{emoji}</span>
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, title, subtitle, color = "amber" }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color?: "amber" | "blue" | "purple";
}) {
  const colors = {
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    blue:  "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    purple:"bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  };
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 p-6 ${className}`}>
      {children}
    </div>
  );
}

function CardTitle({ label, tag }: { label: string; tag?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">{label}</h3>
      {tag && (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700">
          {tag}
        </span>
      )}
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-300">
      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
      {children}
    </li>
  );
}

function SqlBlock({ children }: { children: string }) {
  return (
    <pre className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-[11px] font-mono text-gray-700 dark:text-slate-300 overflow-x-auto leading-relaxed">
      {children}
    </pre>
  );
}

function AccessPattern({ pk, sk, note }: { pk: string; sk: string; note: string }) {
  return (
    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 p-3 text-xs space-y-1">
      <div className="flex gap-2">
        <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 w-8 flex-shrink-0">PK</span>
        <span className="font-mono text-gray-700 dark:text-slate-300">{pk}</span>
      </div>
      <div className="flex gap-2">
        <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 w-8 flex-shrink-0">SK</span>
        <span className="font-mono text-gray-700 dark:text-slate-300">{sk}</span>
      </div>
      <p className="text-gray-500 dark:text-slate-400 pt-1">{note}</p>
    </div>
  );
}

export default function AwsShowcasePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {/* Minimal public nav */}
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ChatScroll" width={26} height={26} className="rounded-md" />
            <span className="font-bold text-sm text-gray-900 dark:text-slate-100">ChatScroll</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:px-6 space-y-14">

        {/* ── Hero ── */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 mb-2">
            🏆 AWS H0 Hackathon — Database Showcase
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 leading-tight">
            How ChatScroll uses<br className="hidden sm:block" />
            <span className="text-amber-600 dark:text-amber-400"> AWS Databases</span>
          </h1>
          <p className="text-base text-gray-500 dark:text-slate-400 max-w-xl mx-auto">
            A technical overview of every AWS Database feature used — from pgvector
            semantic search to DynamoDB TTL.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Badge emoji="🔍" label="pgvector — Semantic search" />
            <Badge emoji="🌲" label="ltree — Folder hierarchy" />
            <Badge emoji="📝" label="tsvector — Full-text search" />
            <Badge emoji="⚡" label="DynamoDB TTL — Auto-expiry" />
            <Badge emoji="🔑" label="Composite Keys — Message indexing" />
            <Badge emoji="🤖" label="gemini-embedding-001" />
          </div>
        </section>

        {/* ── Aurora PostgreSQL ── */}
        <section>
          <SectionTitle
            icon={Database}
            title="Aurora PostgreSQL (Serverless v2)"
            subtitle="Relational core — notes, folders, users, conversations, semantic search"
            color="amber"
          />

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Card 1 — Notes/Scrolls */}
            <Card>
              <CardTitle label="Notes / Scrolls Table" tag="notes" />
              <ul className="space-y-2">
                <Bullet>pgvector extension stores <strong>3072-dim</strong> embeddings per scroll</Bullet>
                <Bullet><code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">gemini-embedding-001</code> generates embeddings on save via <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">TrySaveEmbeddingAsync</code></Bullet>
                <Bullet>Cosine similarity search surfaces semantically related scrolls</Bullet>
                <Bullet>tsvector full-text index for exact keyword matching</Bullet>
                <Bullet>Hybrid search: semantic nearest-neighbour <em>combined</em> with keyword results</Bullet>
              </ul>
              <SqlBlock>{`-- Cosine distance (pgvector)
embedding <=> queryVector

-- Semantic search with threshold
WHERE 1 - (embedding <=> $vec) > 0.5
ORDER BY embedding <=> $vec
LIMIT 3

-- Full-text search
WHERE search_vector @@ plainto_tsquery('english', $q)
ORDER BY ts_rank(search_vector, ...) DESC

-- Helper
SELECT vector_dims(embedding) -- → 3072`}</SqlBlock>
            </Card>

            {/* Card 2 — Folders */}
            <Card>
              <CardTitle label="Folders Table" tag="folders" />
              <ul className="space-y-2">
                <Bullet>ltree extension stores folder paths as dot-separated label trees</Bullet>
                <Bullet>Enables hierarchical queries without recursive CTEs</Bullet>
                <Bullet>e.g. <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">programming.containers</code> → Programming › Containers</Bullet>
                <Bullet>Related-scrolls scoping: find root parent, then include all descendant folder IDs</Bullet>
                <Bullet><code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">parent_id</code> FK used for 2-level hierarchy traversal in API</Bullet>
              </ul>
              <SqlBlock>{`-- ltree path matching
WHERE path ~ 'programming.*'

-- All folders in a subtree
WHERE path = $root
   OR path ~ ($root || '.*')

-- Foreign-key traversal (used in GetRelated)
WHERE folder_id = ANY($allowedIds::uuid[])`}</SqlBlock>
            </Card>

            {/* Card 3 — Conversations */}
            <Card>
              <CardTitle label="Conversations Table" tag="conversations" />
              <ul className="space-y-2">
                <Bullet>Conversation metadata (title, created_at, user_id) lives in Aurora</Bullet>
                <Bullet>Message <em>content</em> lives in DynamoDB — dual-database pattern</Bullet>
                <Bullet>Aurora handles referential integrity; DynamoDB handles message volume</Bullet>
                <Bullet>Anonymous session IDs bridge the two stores before login</Bullet>
                <Bullet>On login, <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">migrate-anonymous</code> re-parents both Aurora rows and DynamoDB items</Bullet>
              </ul>
              <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 text-xs text-amber-700 dark:text-amber-300">
                <strong>Dual-database pattern:</strong> Aurora owns structure + search;
                DynamoDB owns the high-volume chat message stream.
              </div>
            </Card>

            {/* Card 4 — Users */}
            <Card>
              <CardTitle label="Users Table" tag="users" />
              <ul className="space-y-2">
                <Bullet>Cognito JWT <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">sub</code> claim decoded server-side — no middleware or JWT library needed</Bullet>
                <Bullet>Anonymous users get a browser-generated UUID via <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">X-User-Id</code> header</Bullet>
                <Bullet><code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">EnsureUserExistsAsync</code> auto-creates the row on first API request — no registration step needed</Bullet>
                <Bullet>User profile (display name, email) synced from Cognito JWT claims on each call</Bullet>
              </ul>
              <SqlBlock>{`-- Identity resolution order (ApiControllerBase)
1. Authorization: Bearer <cognitoJwt>
   → decode payload → parse sub as UUID
2. X-User-Id header → parse as UUID
3. Hard-coded dev fallback (local only)`}</SqlBlock>
            </Card>
          </div>
        </section>

        {/* ── DynamoDB ── */}
        <section>
          <SectionTitle
            icon={Zap}
            title="Amazon DynamoDB"
            subtitle="High-volume chat messages — composite keys, TTL, and pay-per-request"
            color="blue"
          />

          <Card>
            <CardTitle label="Chat Messages Table" tag="chatscroll-messages" />
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <ul className="space-y-2 mb-4">
                  <Bullet>Partition key groups all messages in a conversation together</Bullet>
                  <Bullet>Sort key <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">timestamp#messageId</code> enables chronological reads and time-range queries</Bullet>
                  <Bullet>TTL attribute auto-expires messages after <strong>90 days</strong> — no cron jobs, no manual deletes</Bullet>
                  <Bullet><code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">PAY_PER_REQUEST</code> billing — scales to millions of messages with zero capacity planning</Bullet>
                  <Bullet>Each item stores role (user/assistant), content, folderSuggestion metadata</Bullet>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Access Patterns</p>
                <AccessPattern
                  pk="conversationId = :convId"
                  sk="begins_with SK, ''"
                  note="Fetch all messages in a conversation, ordered chronologically"
                />
                <AccessPattern
                  pk="conversationId = :convId"
                  sk="between :t1 and :t2"
                  note="Fetch messages within a time range (e.g. last 100 messages)"
                />
                <div className="rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 p-3 text-xs font-mono space-y-1 text-gray-700 dark:text-slate-300">
                  <div><span className="text-blue-600 dark:text-blue-400 font-semibold">PK</span>  conversationId  <span className="text-gray-400">(String)</span></div>
                  <div><span className="text-purple-600 dark:text-purple-400 font-semibold">SK</span>  {"{timestamp}#{messageId}"}  <span className="text-gray-400">(String)</span></div>
                  <div><span className="text-emerald-600 dark:text-emerald-400 font-semibold">TTL</span> expiresAt  <span className="text-gray-400">(Unix epoch, 90d)</span></div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Architecture Diagram ── */}
        <section>
          <SectionTitle
            icon={Layers}
            title="System Architecture"
            subtitle="Request flow from browser to databases"
            color="purple"
          />

          <Card>
            <div className="overflow-x-auto">
              <div className="min-w-[540px] space-y-3 text-sm font-mono">
                {/* Row 1 */}
                <div className="flex items-center justify-center gap-0">
                  <div className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-center">
                    <div className="text-xs text-gray-500 dark:text-slate-400">Browser</div>
                    <div className="font-semibold text-gray-800 dark:text-slate-200">Next.js / Vercel</div>
                  </div>
                  <div className="flex-1 border-t-2 border-dashed border-gray-300 dark:border-slate-600 mx-2" />
                  <div className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 text-center">
                    <div className="text-xs text-amber-600 dark:text-amber-400">AWS ECS Fargate</div>
                    <div className="font-semibold text-amber-800 dark:text-amber-200">ASP.NET Core API</div>
                  </div>
                </div>

                {/* Down arrows from API */}
                <div className="flex justify-end pr-[60px]">
                  <div className="flex gap-20">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-6 bg-gray-300 dark:bg-slate-600" />
                      <div className="text-gray-400">↓</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-6 bg-gray-300 dark:bg-slate-600" />
                      <div className="text-gray-400">↓</div>
                    </div>
                  </div>
                </div>

                {/* Row 2 — two DB boxes */}
                <div className="flex items-stretch justify-end gap-4 pr-0">
                  <div className="flex-1" />
                  <div className="px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/40 text-center min-w-[190px]">
                    <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Aurora PostgreSQL</div>
                    <div className="text-xs text-gray-600 dark:text-slate-300 space-y-0.5">
                      <div>📜 scrolls + embeddings</div>
                      <div>🌲 folders (ltree)</div>
                      <div>👤 users (Cognito sub)</div>
                      <div>💬 conversation metadata</div>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-center min-w-[190px]">
                    <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">DynamoDB</div>
                    <div className="text-xs text-gray-600 dark:text-slate-300 space-y-0.5">
                      <div>💬 chat messages</div>
                      <div>⚡ TTL (90-day expiry)</div>
                      <div>🔑 composite sort keys</div>
                      <div>📈 pay-per-request scale</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center text-gray-500 dark:text-slate-400">
              <div><span className="font-semibold text-gray-700 dark:text-slate-300">Next.js</span><br />App Router · Vercel</div>
              <div><span className="font-semibold text-gray-700 dark:text-slate-300">ASP.NET Core</span><br />ECS Fargate · ECR</div>
              <div><span className="font-semibold text-gray-700 dark:text-slate-300">Aurora PG</span><br />Serverless v2 · pgvector</div>
              <div><span className="font-semibold text-gray-700 dark:text-slate-300">DynamoDB</span><br />On-demand · TTL</div>
            </div>
          </Card>
        </section>

        {/* ── Deployment ── */}
        <section>
          <SectionTitle
            icon={GitBranch}
            title="CI/CD Deployment"
            subtitle="GitHub Actions → ECR → ECS Fargate"
            color="amber"
          />

          <Card>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Code2 className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Pipeline</span>
                </div>
                <ul className="space-y-2">
                  <Bullet>Push to <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">master</code> triggers GitHub Actions workflow</Bullet>
                  <Bullet>Docker image built and pushed to Amazon ECR</Bullet>
                  <Bullet>ECS task definition registered automatically per deploy</Bullet>
                  <Bullet>ECS service updated; polling loop waits for stabilization</Bullet>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Server className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Infrastructure</span>
                </div>
                <ul className="space-y-2">
                  <Bullet>ECS Fargate — serverless containers, no EC2 management</Bullet>
                  <Bullet>ALB with HTTPS termination in front of ECS tasks</Bullet>
                  <Bullet>Secrets (DB password, Gemini key) via ECS task environment</Bullet>
                  <Bullet>Aurora Serverless v2 — auto-pauses when idle</Bullet>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">Observability</span>
                </div>
                <ul className="space-y-2">
                  <Bullet>Health check endpoint: <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">GET /api/health</code></Bullet>
                  <Bullet>Live stats endpoint: <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">GET /api/stats</code></Bullet>
                  <Bullet>Embedding backfill: <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">POST /api/notes/admin/backfill-embeddings</code></Bullet>
                  <Bullet>Storage type exposed in stats response: <code className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded">aurora_pgvector</code></Bullet>
                </ul>
              </div>
            </div>

            {/* Pipeline visualization */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono justify-center">
                {[
                  { label: "git push", bg: "bg-gray-100 dark:bg-slate-800", text: "text-gray-700 dark:text-slate-300" },
                  { label: "→", bg: "", text: "text-gray-400" },
                  { label: "GitHub Actions", bg: "bg-gray-100 dark:bg-slate-800", text: "text-gray-700 dark:text-slate-300" },
                  { label: "→", bg: "", text: "text-gray-400" },
                  { label: "docker build", bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", border: "border border-blue-200 dark:border-blue-800/40" },
                  { label: "→", bg: "", text: "text-gray-400" },
                  { label: "ECR push", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", border: "border border-amber-200 dark:border-amber-700/40" },
                  { label: "→", bg: "", text: "text-gray-400" },
                  { label: "ECS deploy", bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", border: "border border-emerald-200 dark:border-emerald-800/40" },
                  { label: "→", bg: "", text: "text-gray-400" },
                  { label: "✅ live", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400", border: "border border-emerald-200 dark:border-emerald-700/40" },
                ].map((step, i) => (
                  step.bg ? (
                    <span key={i} className={`px-2.5 py-1 rounded-lg ${step.bg} ${step.text} ${step.border ?? ""}`}>
                      {step.label}
                    </span>
                  ) : (
                    <span key={i} className={step.text}>{step.label}</span>
                  )
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* ── Footer CTA ── */}
        <section className="text-center pb-4">
          <div className="inline-flex flex-col items-center gap-3">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              See it in action — save an AI answer as a Scroll and watch the embedding get generated.
            </p>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              Try ChatScroll →
            </Link>
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-200 dark:border-slate-800 py-5 text-center text-xs text-gray-400 dark:text-slate-600">
        ChatScroll · AWS H0 Hackathon · June 2026
      </footer>
    </div>
  );
}
