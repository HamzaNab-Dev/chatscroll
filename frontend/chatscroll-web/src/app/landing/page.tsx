import Link from "next/link";
import { ScrollText, Brain, Search, FolderTree, Check, Zap, Shield } from "lucide-react";

export const metadata = {
  title: "ChatScroll — Every Question Becomes Lasting Knowledge",
  description:
    "Turn every AI conversation into permanent, organized, searchable knowledge. Built on Amazon Aurora PostgreSQL + Bedrock.",
};

const FEATURES = [
  {
    icon: Brain,
    title: "AI-Suggested Organization",
    description:
      "Claude Sonnet 4.6 automatically suggests which folder to file every answer — programming, medicine, recipes, or any topic.",
    highlight: "Amazon Bedrock",
  },
  {
    icon: Search,
    title: "Semantic Search",
    description:
      "Find notes by meaning, not just keywords. Titan Embeddings v2 converts your knowledge into 1024-dimension vectors stored in Aurora pgvector.",
    highlight: "pgvector + Aurora",
  },
  {
    icon: FolderTree,
    title: "Hierarchical Knowledge Tree",
    description:
      "Organize knowledge into nested folders using Aurora ltree paths — programming.dotnet.ef_core grows naturally as you learn.",
    highlight: "ltree paths",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Ask anything",
    body: "Type any question in the chat. Claude Sonnet 4.6 answers with expert knowledge.",
  },
  {
    step: "02",
    title: "AI suggests where to save",
    body: "Claude reads your knowledge tree and suggests the best folder — or proposes creating a new one.",
  },
  {
    step: "03",
    title: "Your knowledge grows",
    body: "The answer is rewritten as a clean, evergreen note and saved to Aurora PostgreSQL with vector embeddings.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "Start building your knowledge base",
    features: [
      "50 notes per month",
      "3 knowledge folders",
      "Keyword search",
      "Chat history: 7 days",
    ],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "9",
    period: "per month",
    description: "For serious learners and developers",
    features: [
      "Unlimited notes",
      "Unlimited folders",
      "Semantic search (pgvector)",
      "Chat history: 90 days (DynamoDB)",
      "Export to Markdown",
      "Priority AI responses",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Business",
    price: "29",
    period: "per month",
    description: "For teams building shared knowledge",
    features: [
      "Everything in Pro",
      "Team knowledge sharing",
      "Admin dashboard",
      "Audit logs",
      "SSO / SAML",
      "Dedicated support",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-slate-100 tracking-tight">ChatScroll</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="#pricing"
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="text-sm bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Try free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/30 rounded-full px-4 py-1.5 text-xs text-amber-600 dark:text-amber-400 mb-8">
          <Zap className="w-3 h-3" />
          Built for the AWS H0 Hackathon · Aurora PostgreSQL + Bedrock
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-slate-100 leading-tight mb-6">
          Every question becomes{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
            lasting knowledge
          </span>
        </h1>

        <p className="text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          ChatScroll turns every AI conversation into permanent, organized knowledge.
          Ask questions on the left. Watch your personal knowledge tree grow on the right.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3.5 rounded-xl font-medium text-base transition-colors w-full sm:w-auto"
          >
            Start for free →
          </Link>
          <Link
            href="#how-it-works"
            className="text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors text-base"
          >
            See how it works
          </Link>
        </div>

        {/* Hero visual */}
        <div className="mt-14 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 text-left max-w-2xl mx-auto shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="text-xs text-gray-400 dark:text-slate-600 ml-2">ChatScroll</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 dark:bg-slate-950 rounded-lg p-3 border border-gray-200 dark:border-slate-800">
              <div className="text-xs text-gray-400 dark:text-slate-500 mb-2">Chat</div>
              <div className="bg-amber-50 dark:bg-amber-700/20 border border-amber-200 dark:border-amber-700/30 rounded-lg p-2 text-xs text-amber-800 dark:text-amber-200 mb-2">
                What is dependency injection?
              </div>
              <div className="bg-gray-100 dark:bg-slate-800/60 rounded-lg p-2 text-xs text-gray-600 dark:text-slate-400">
                Dependency Injection (DI) is a design pattern where dependencies are provided from outside rather than created internally...
              </div>
              <div className="mt-2 bg-gray-50 dark:bg-slate-800/40 border border-amber-200 dark:border-amber-600/20 rounded-lg p-2 text-xs text-amber-600 dark:text-amber-400">
                💾 Save to programming.dotnet?
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-950 rounded-lg p-3 border border-gray-200 dark:border-slate-800">
              <div className="text-xs text-gray-400 dark:text-slate-500 mb-2">Knowledge Tree</div>
              <div className="space-y-1.5">
                {["📁 Programming", "  📂 .NET", "    📄 DI Pattern", "📁 Medicine"].map((item) => (
                  <div key={item} className="text-xs text-gray-500 dark:text-slate-500">{item}</div>
                ))}
              </div>
              <div className="mt-3 border-t border-gray-200 dark:border-slate-800 pt-2">
                <div className="text-xs text-gray-400 dark:text-slate-600 mb-1">This week</div>
                <div className="flex items-end gap-1 h-6">
                  {[1, 3, 2, 4, 1, 3, 5].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-amber-400/50 dark:bg-amber-500/50 rounded-sm"
                      style={{ height: `${(h / 5) * 24}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-slate-100 mb-3">
          Powered by AWS
        </h2>
        <p className="text-gray-500 dark:text-slate-500 text-center mb-12 max-w-lg mx-auto">
          Built on enterprise-grade AWS infrastructure so your knowledge is always fast,
          searchable, and secure.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 hover:border-amber-300 dark:hover:border-amber-800/40 transition-colors shadow-sm dark:shadow-none"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-500 leading-relaxed mb-3">{f.description}</p>
              <span className="text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/30 rounded-full px-2.5 py-0.5">
                {f.highlight}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 py-16 border-t border-gray-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-slate-100 mb-3">
          How it works
        </h2>
        <p className="text-gray-500 dark:text-slate-500 text-center mb-12">
          Three steps from question to permanent knowledge
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-600/20 dark:to-orange-600/10 border border-amber-200 dark:border-amber-700/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-bold text-amber-600 dark:text-amber-500">{step.step}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-800 dark:text-slate-200 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* "Already Know This" feature callout */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/40 flex items-center justify-center flex-shrink-0">
            <Brain className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300 mb-2">
              &ldquo;You&apos;ve researched this before!&rdquo;
            </h3>
            <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
              Before Claude answers, ChatScroll checks your knowledge tree for similar notes using
              pgvector semantic similarity. If you&apos;ve already saved an answer, you&apos;ll see which note
              to review instead of repeating the same research.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-16 border-t border-gray-200 dark:border-slate-800">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-slate-100 mb-3">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500 dark:text-slate-500 text-center mb-12">
          Start free. Upgrade when your knowledge base grows.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col shadow-sm dark:shadow-none ${
                plan.highlighted
                  ? "border-amber-400 dark:border-amber-600/50 bg-amber-50 dark:bg-amber-950/20"
                  : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40"
              }`}
            >
              {plan.highlighted && (
                <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-3 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Most popular
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{plan.name}</h3>
              <div className="my-3">
                <span className="text-3xl font-bold text-gray-900 dark:text-slate-100">${plan.price}</span>
                <span className="text-gray-400 dark:text-slate-500 text-sm ml-1">/{plan.period}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-500 mb-6">{plan.description}</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-gray-600 dark:text-slate-400">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.name === "Business" ? "mailto:hello@chatscroll.app" : "/"}
                className={`text-center py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-amber-600 hover:bg-amber-500 text-white"
                    : "border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-600 hover:text-gray-900 dark:hover:text-slate-100"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* AWS Tech stack strip */}
      <section className="border-t border-gray-200 dark:border-slate-800 py-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs text-gray-400 dark:text-slate-600 uppercase tracking-widest mb-6">
            Built on enterprise AWS infrastructure
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              "Aurora PostgreSQL Serverless v2",
              "Amazon Bedrock",
              "Claude Sonnet 4.6",
              "Titan Embeddings v2",
              "Amazon DynamoDB",
              "AWS Cognito",
              "AWS App Runner",
            ].map((tech) => (
              <span
                key={tech}
                className="text-xs text-gray-500 dark:text-slate-500 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-full px-3 py-1"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6">
          <ScrollText className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">
          Stop losing your best ideas
        </h2>
        <p className="text-gray-500 dark:text-slate-400 mb-8">
          Join developers and learners building a second brain with ChatScroll.
          Every question you ask makes you permanently smarter.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-8 py-3.5 rounded-xl font-medium text-base transition-colors"
        >
          <Shield className="w-4 h-4" />
          Start for free — no credit card required
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ScrollText className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-500 dark:text-slate-400">ChatScroll</span>
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-600 text-center">
            Created for the AWS H0 Hackathon · #H0Hackathon
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-600">
            <Link href="/" className="hover:text-gray-700 dark:hover:text-slate-400 transition-colors">App</Link>
            <Link href="/login" className="hover:text-gray-700 dark:hover:text-slate-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
