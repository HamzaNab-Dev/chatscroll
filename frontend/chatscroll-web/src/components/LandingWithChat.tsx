"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { ScrollText, Send, ArrowRight, ChevronDown, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "SOLID principles?",
  "How does Docker work?",
  "Explain async/await",
  "What is pgvector?",
];

const AWS_STACK = [
  { icon: "🗄️", name: "Aurora PostgreSQL", desc: "Serverless v2 with pgvector + ltree" },
  { icon: "⚡", name: "Amazon ECS", desc: "Express Mode auto-scaling" },
  { icon: "🔐", name: "Cognito", desc: "User auth & JWT" },
  { icon: "🤖", name: "Gemini 2.5 Flash", desc: "AI responses & knowledge rewriting" },
  { icon: "📦", name: "Amazon ECR", desc: "Container registry" },
  { icon: "🌐", name: "Vercel", desc: "Frontend deployment" },
];

const AUTH_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/library", label: "Library" },
];

export function LandingWithChat() {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = () => {
    const q = question.trim();
    if (!q || submitting) return;
    setSubmitting(true);
    sessionStorage.setItem("pendingQuestion", q);
    router.push(isAuthenticated ? "/chat" : "/login");
  };

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {/* Navigation — auth-aware */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800/50">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-slate-100 text-sm tracking-tight">ChatScroll</span>
        </Link>

        {isAuthenticated ? (
          /* Authenticated nav: Home / Chat / Library + theme + avatar */
          <>
            <nav className="hidden md:flex items-center gap-1 mx-auto">
              {AUTH_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm transition-colors",
                    pathname === link.href
                      ? "bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-300 font-medium"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu />
            </div>
          </>
        ) : (
          /* Unauthenticated nav: Features / How it works + Sign In + Start Free */
          <>
            <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-slate-400 mx-auto">
              <a href="#features" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">How it works</a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                Start Free <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
          <ScrollText className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-3 tracking-tight">
          ChatScroll
        </h1>
        <p className="text-lg text-gray-500 dark:text-slate-400 mb-8">Every question becomes lasting knowledge</p>

        {/* Chat box — redirects on submit */}
        <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask anything to get started..."
            disabled={submitting}
            rows={2}
            className="w-full bg-transparent px-5 py-4 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none resize-none disabled:opacity-60"
          />
          <div className="flex items-center justify-end px-4 pb-3">
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium disabled:opacity-40 transition-all"
            >
              {submitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {submitting ? "Opening..." : "Try it"}
            </button>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          <span className="text-xs text-gray-400 dark:text-slate-600 self-center">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuestion(s)}
              disabled={submitting}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/login"
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            Start for Free <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#how-it-works"
            className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-600 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
          >
            See How It Works <ChevronDown className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-gray-200 dark:border-slate-800 bg-gray-100/80 dark:bg-slate-900/50 py-4">
        <div className="max-w-2xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-slate-400">
          <span>📜 Save Scrolls</span>
          <span className="text-gray-300 dark:text-slate-700">•</span>
          <span>🔍 Search Instantly</span>
          <span className="text-gray-300 dark:text-slate-700">•</span>
          <span>🧠 Never Forget</span>
        </div>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 text-center mb-12">How It Works</h2>
        <div className="grid sm:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Ask", desc: "Type anything you want to learn" },
            { step: "2", title: "AI Answers", desc: "Get a concise, smart answer" },
            { step: "3", title: "Save as Scroll", desc: "One click saves it to your library" },
          ].map(({ step, title, desc }) => (
            <div key={step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-amber-600 text-white font-bold text-lg flex items-center justify-center mx-auto mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-gray-700 dark:text-slate-200 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AWS Infrastructure section */}
      <section className="border-y border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 text-center mb-2">
            🏗️ Built on Production-Grade AWS Infrastructure
          </h2>
          <p className="text-gray-500 dark:text-slate-500 text-sm text-center mb-10">
            Every layer is production-ready and deployed on AWS
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {AWS_STACK.map(({ icon, name, desc }) => (
              <div
                key={name}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 hover:border-amber-500/20 transition-colors"
              >
                <div className="text-xl mb-2">{icon}</div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-0.5">{name}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-600 text-center mt-6">
            + DynamoDB for chat logs · CloudWatch monitoring · GitHub Actions CI/CD auto-deployment
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 text-center mb-12">Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🧠", title: "AI-Powered", desc: "Ask anything, get smart answers powered by Gemini 2.5 Flash" },
              { icon: "📚", title: "Scroll Library", desc: "All your saved knowledge in one searchable place" },
              { icon: "🔍", title: "Smart Search", desc: "Find any scroll instantly with semantic search" },
              { icon: "📁", title: "Organized", desc: "Auto-categorized into folders & sub-folders" },
              { icon: "💡", title: "Already Know?", desc: "Detects if you've researched this topic before" },
              {
                icon: "☁️",
                title: "AWS Native",
                desc: "Aurora PostgreSQL Serverless v2 with pgvector semantic search, DynamoDB chat logs, ECS Express deployment, and Cognito authentication",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-5 hover:border-amber-500/20 transition-colors"
              >
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-gray-800 dark:text-slate-200 mb-1 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-3">
          Start building your knowledge library today
        </h2>
        <p className="text-gray-500 dark:text-slate-500 mb-8 text-sm">
          Join ChatScroll and never forget what you learned
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-colors"
        >
          Create Free Account <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-6 text-center text-xs text-gray-400 dark:text-slate-600">
        ChatScroll · Built for AWS H0 Hackathon · #H0Hackathon
      </footer>
    </div>
  );
}
