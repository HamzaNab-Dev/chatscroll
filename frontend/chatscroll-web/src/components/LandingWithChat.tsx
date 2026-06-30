"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Send, ArrowRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Navigation } from "@/components/Navigation";

const SUGGESTIONS = [
  "SOLID principles?",
  "How does Docker work?",
  "Explain async/await",
  "What is pgvector?",
];

const AWS_STACK = [
  { icon: "🗄️", name: "Aurora PostgreSQL", desc: "Serverless v2 with pgvector + ltree" },
  { icon: "⚡", name: "Amazon ECS Fargate", desc: "Containerized API auto-scaling" },
  { icon: "🔐", name: "Cognito", desc: "User auth & JWT" },
  { icon: "🤖", name: "Gemini 2.5 Flash", desc: "AI responses & knowledge rewriting" },
  { icon: "📦", name: "Amazon ECR", desc: "Container registry" },
  { icon: "🌐", name: "Vercel", desc: "Frontend deployment" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export function LandingWithChat() {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  // undefined = loading, number = loaded, null = failed (hide)
  const [totalScrolls, setTotalScrolls] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    fetch(`${API_URL}/api/stats`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (typeof data?.totalScrolls === "number") setTotalScrolls(data.totalScrolls);
        else setTotalScrolls(null);
      })
      .catch(() => setTotalScrolls(null));
  }, []);

  const handleSubmit = () => {
    const q = question.trim();
    if (!q || submitting) return;
    setSubmitting(true);
    sessionStorage.setItem("pendingQuestion", q);
    router.push("/chat");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Navigation />

      {/* Hero */}
      <section className="relative max-w-3xl mx-auto px-6 pt-20 pb-16 text-center overflow-hidden">
        {/* Ambient glow behind icon */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[420px] bg-amber-300/10 dark:bg-amber-500/5 blur-3xl rounded-full pointer-events-none -z-10" />

        {/* Logo with pulse ring */}
        <div className="relative inline-flex items-center justify-center mb-7">
          <div className="absolute w-32 h-32 rounded-3xl bg-amber-400/15 dark:bg-amber-500/10 animate-pulse" />
          <Image src="/logo.png" alt="ChatScroll" width={96} height={96} className="relative rounded-2xl shadow-xl shadow-amber-500/30 dark:shadow-amber-600/20" />
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-4 tracking-tight leading-tight">
          AI-powered{" "}
          <span className="text-amber-600 dark:text-amber-400">knowledge</span>
          {" "}that sticks
        </h1>

        {/* Description */}
        <p className="text-base sm:text-lg text-gray-500 dark:text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
          Ask anything. Save the best answers as{" "}
          <strong className="text-gray-700 dark:text-slate-300 font-semibold">Scrolls</strong>.
          {" "}Come back any time — your knowledge, always at hand.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {[
            { icon: "📜", label: "Save Scrolls" },
            { icon: "📂", label: "Auto-organized" },
            { icon: "🔍", label: "Semantic Search" },
            { icon: "🤖", label: "Gemini AI" },
            { icon: "📤", label: "Share Scrolls", isNew: true },
            { icon: "🎓", label: "Study Mode", isNew: true },
            { icon: "🧠", label: "Never re-Google" },
          ].map(({ icon, label, isNew }) => (
            <span
              key={label}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border shadow-sm",
                isNew
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400"
                  : "bg-white dark:bg-slate-800/80 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400"
              )}
            >
              {icon} {label}
              {isNew && <span className="text-[9px] font-bold bg-amber-500 text-white rounded-full px-1 py-px leading-none ml-0.5">NEW</span>}
            </span>
          ))}
        </div>

        {/* Chat box — the main hero interaction */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl shadow-gray-300/40 dark:shadow-slate-950/60 mb-3">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/30">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400">ChatScroll AI · Online</span>
            </div>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-slate-700" />
            </div>
          </div>

          {/* Input row */}
          <div className="flex items-end gap-3 px-4 pt-3 pb-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What do you want to learn today? Ask anything..."
              disabled={submitting}
              rows={2}
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none resize-none disabled:opacity-60"
            />
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || submitting}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-md shadow-amber-500/30"
            >
              {submitting ? (
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-9">
          <span className="text-xs text-gray-400 dark:text-slate-600 self-center">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuestion(s)}
              disabled={submitting}
              className="text-xs px-3 py-1.5 rounded-full bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-400/60 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/60 dark:hover:bg-amber-950/20 transition-all disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {isAuthenticated ? (
            <button
              onClick={() => { try { sessionStorage.setItem("cs_force_new", "1"); } catch {} router.push("/chat"); }}
              className="px-7 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-amber-500/25"
            >
              Open ChatScroll <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <Link
              href="/login?mode=signup"
              className="px-7 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-amber-500/25"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <a
            href="#how-it-works"
            className="px-7 py-3 border border-gray-300 dark:border-slate-700 hover:border-gray-400 dark:hover:border-slate-500 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 bg-white dark:bg-transparent"
          >
            See How It Works <ChevronDown className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 py-3">
        <div className="max-w-4xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-0 gap-y-2">
          {/* Item 1: dynamic scroll count */}
          <div className="flex items-center gap-1.5 px-5">
            <span className="text-sm">📜</span>
            {totalScrolls === undefined ? (
              <div className="h-3.5 w-10 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
            ) : totalScrolls !== null ? (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{totalScrolls.toLocaleString()}</span>
            ) : null}
            <span className="text-xs text-gray-500 dark:text-slate-400">Scrolls saved globally</span>
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
          {/* Item 2 */}
          <div className="flex items-center gap-1.5 px-5">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Gemini 2.5 Flash</span>
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
          {/* Item 3 */}
          <div className="flex items-center gap-1.5 px-5">
            <span className="text-sm">🔍</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">pgvector</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">Semantic Search</span>
          </div>
          <div className="w-px h-4 bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
          {/* Item 4 */}
          <div className="flex items-center gap-1.5 px-5">
            <span className="text-sm">🏆</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">AWS H0 Hackathon</span>
            <span className="text-xs text-gray-500 dark:text-slate-400">2026</span>
          </div>
        </div>
      </div>

      {/* Problem Statistics */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              The problem with AI answers today
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { stat: "73%",     desc: "of people re-Google questions they've already found answers to before" },
              { stat: "30 days", desc: "before AI chat history becomes too long to search through effectively" },
              { stat: "0",       desc: "knowledge saved from your last 100 AI conversations — unless you use ChatScroll" },
            ].map(({ stat, desc }) => (
              <div key={stat} className="text-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-800/40 transition-all">
                <div className="text-4xl sm:text-5xl font-bold text-amber-600 dark:text-amber-400 mb-3">{stat}</div>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — visual product demo */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
              Ask once. Keep forever.
            </h2>
            <p className="text-base text-gray-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Stop re-Googling the same thing. Every question you ask becomes a searchable knowledge note in your personal library.
            </p>
          </div>

          {/* 4-step flow */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-14">
            {[
              { emoji: "💬", label: "You ask", desc: "Any question, any topic" },
              { emoji: "⚡", label: "AI answers", desc: "Concise, focused response" },
              { emoji: "📜", label: "Save it", desc: "One click → Scroll saved" },
              { emoji: "🔍", label: "Find it anytime", desc: "Search your library instantly" },
            ].map(({ emoji, label, desc }, i) => (
              <div key={label} className="relative text-center">
                {i < 3 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+24px)] right-[-50%] h-px bg-gradient-to-r from-amber-300/60 to-amber-200/20 dark:from-amber-600/30 dark:to-amber-500/10" />
                )}
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 flex items-center justify-center mx-auto mb-3 text-2xl relative z-10 shadow-sm">
                  {emoji}
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">{label}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-snug">{desc}</p>
              </div>
            ))}
          </div>

          {/* Mini app preview */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xl">
            {/* Browser chrome */}
            <div className="bg-gray-100 dark:bg-slate-800/80 px-4 py-2.5 flex items-center gap-3 border-b border-gray-200 dark:border-slate-700">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80 dark:bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80 dark:bg-amber-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 dark:bg-emerald-500/50" />
              </div>
              <div className="flex-1 bg-white dark:bg-slate-700 rounded-md px-3 py-1 text-[11px] text-gray-400 dark:text-slate-500 text-center">
                chatscroll.app/chat
              </div>
            </div>

            {/* Mock app content */}
            <div className="bg-white dark:bg-slate-950 grid sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-slate-800">
              {/* Chat panel - wider */}
              <div className="sm:col-span-3 p-5 space-y-3">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-600 uppercase tracking-wider">Chat</p>

                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-amber-50 dark:bg-amber-700/20 border border-amber-200 dark:border-amber-600/30 rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%]">
                    <p className="text-xs text-amber-900 dark:text-amber-200">What is the CAP theorem in distributed systems?</p>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-slate-400 flex-shrink-0 mt-0.5">AI</div>
                  <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/60 rounded-2xl rounded-tl-sm px-3 py-2 flex-1">
                    <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
                      The <strong>CAP theorem</strong> states that a distributed system can only guarantee two of three properties:
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-xs text-gray-600 dark:text-slate-400">
                      <li>• <strong>C</strong>onsistency — every read gets the latest write</li>
                      <li>• <strong>A</strong>vailability — every request gets a response</li>
                      <li>• <strong>P</strong>artition tolerance — survives network splits</li>
                    </ul>
                  </div>
                </div>

                {/* Save bar — compact version of the real UI */}
                <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10 px-3 py-1.5">
                  <span className="text-sm">📜</span>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex-1">Databases → Distributed Systems</span>
                  <span className="text-[11px] px-2.5 py-0.5 bg-amber-600 text-white rounded-full font-medium">Save</span>
                </div>
              </div>

              {/* Your Scrolls panel */}
              <div className="sm:col-span-2 p-5 space-y-2 bg-gray-50/50 dark:bg-slate-900/30">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-600 uppercase tracking-wider mb-3">Your Scroll Library</p>
                {[
                  { icon: "💻", folder: "Programming", title: "SOLID Principles" },
                  { icon: "🗄️", folder: "Databases", title: "CAP Theorem" },
                  { icon: "🐳", folder: "DevOps", title: "Docker vs VMs" },
                ].map(({ icon, folder, title }) => (
                  <div key={title} className="flex items-start gap-2.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
                    <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">{folder}</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate">{title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* New Features showcase */}
      <section className="py-20 bg-gradient-to-b from-white to-amber-50/40 dark:from-slate-950 dark:to-amber-950/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40 rounded-full px-3 py-1 mb-4">
              ✨ New Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              More than just a chat history
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              ChatScroll turns your AI conversations into a living knowledge system you can search, share, and study.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {/* Semantic Search */}
            <div className="group relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-amber-400/50 dark:hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">NEW</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center mb-4 text-xl">
                🔍
              </div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-2">Semantic Search</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
                Find scrolls by meaning, not just keywords. Type a concept and AI surfaces the most relevant results — even when the words don&apos;t match.
              </p>
              <div className="rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50 px-3 py-2 text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Powered by Aurora pgvector
              </div>
            </div>

            {/* Share Scrolls */}
            <div className="group relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-amber-400/50 dark:hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">NEW</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-center mb-4 text-xl">
                📤
              </div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-2">Share Scrolls</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
                One click generates a public link anyone can open — no account needed. Share your best explanations with teammates, students, or the world.
              </p>
              <div className="rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50 px-3 py-2 text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                Public links · No login required
              </div>
            </div>

            {/* Study Mode */}
            <div className="group relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-amber-400/50 dark:hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
              <div className="absolute top-4 right-4">
                <span className="text-[9px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">NEW</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40 flex items-center justify-center mb-4 text-xl">
                🎓
              </div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-2">Study Mode</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
                Flip through your scroll library like flashcards. See the title, reveal the full answer, navigate with keyboard shortcuts — built to make knowledge stick.
              </p>
              <div className="rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-700/50 px-3 py-2 text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                Space reveal · ← → navigate · Esc exit
              </div>
            </div>
          </div>

          {/* Export callout — horizontal strip below the 3 cards */}
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 hover:border-amber-400/40 dark:hover:border-amber-600/30 transition-all">
            <div className="text-2xl flex-shrink-0">📄</div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-0.5">Export to PDF & Markdown</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Download any scroll as a beautifully formatted PDF or a portable Markdown file with YAML frontmatter — your notes, in any format you need.</p>
            </div>
            <span className="flex-shrink-0 text-[9px] font-bold bg-amber-500 text-white rounded-full px-2 py-0.5 leading-none">NEW</span>
          </div>
        </div>
      </section>

      {/* AWS Infrastructure section */}
      <section className="border-y border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/40 py-16">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">Infrastructure</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              🏗️ Built on Production-Grade AWS
            </h2>
            <p className="text-base text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              Every layer is production-ready, auto-scaling, and deployed on AWS — built for the AWS H0 Hackathon.
            </p>
          </div>
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
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-3">Everything you need</h2>
            <p className="text-base text-gray-500 dark:text-slate-400 max-w-md mx-auto">
              A complete knowledge management system powered by production-grade AWS infrastructure.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🧠", title: "AI-Powered Chat", desc: "Ask anything, get concise answers powered by Gemini 2.5 Flash with 5-step reasoning" },
              { icon: "📚", title: "Scroll Library", desc: "All your saved knowledge in one searchable, organized place — never lose an insight again" },
              { icon: "🔍", title: "Semantic Search", desc: "pgvector cosine similarity finds scrolls by meaning, not just keywords. Toggle between keyword and AI search modes" },
              { icon: "📁", title: "Smart Folders", desc: "AI auto-suggests the right folder with emoji icon picker and nested sub-folder support" },
              { icon: "💡", title: "Duplicate Detection", desc: "ChatScroll detects when you've researched a topic before and links you to your existing scroll" },
              { icon: "📤", title: "Share Scrolls", desc: "Generate a public link for any scroll — no login required for viewers. Share knowledge with teammates or students" },
              { icon: "🎓", title: "Study Mode", desc: "Flashcard-style review of your library — reveal answers on demand, navigate with keyboard shortcuts, track progress" },
              { icon: "📄", title: "Export PDF & MD", desc: "Download any scroll as a formatted PDF or Markdown file with YAML frontmatter for portability" },
              {
                icon: "☁️",
                title: "AWS Native",
                desc: "Aurora PostgreSQL Serverless v2 with pgvector · DynamoDB chat logs · ECS Fargate · ECR · Cognito auth · GitHub Actions CI/CD",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 hover:border-amber-400/40 dark:hover:border-amber-600/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all"
              >
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-bold text-gray-800 dark:text-slate-200 mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">Comparison</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              Not just another AI chat
            </h2>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
              <div className="px-5 py-3 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Feature</div>
              <div className="px-5 py-3 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider text-center">Other AI Chats</div>
              <div className="px-5 py-3 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-center">ChatScroll</div>
            </div>
            {[
              { feature: "Save answers",     other: "❌ Lost forever",     us: "✅ Saved as Scrolls"     },
              { feature: "Organization",     other: "❌ None",             us: "✅ AI auto-organizes"    },
              { feature: "Search",           other: "❌ Keyword only",     us: "✅ Semantic AI search"   },
              { feature: "Study mode",       other: "❌ Not available",    us: "✅ Flashcard review"     },
              { feature: "Share knowledge",  other: "❌ Copy-paste only",  us: "✅ Share scroll links"   },
              { feature: "Cross-device",     other: "❌ Session only",     us: "✅ Login anywhere"       },
              { feature: "Export",           other: "❌ Screenshots",      us: "✅ PDF & Markdown"       },
            ].map(({ feature, other, us }, i) => (
              <div key={feature} className={cn("grid grid-cols-3 border-b border-gray-100 dark:border-slate-800 last:border-0", i % 2 === 1 ? "bg-gray-50/50 dark:bg-slate-900/30" : "")}>
                <div className="px-5 py-3.5 text-sm font-medium text-gray-700 dark:text-slate-300">{feature}</div>
                <div className="px-5 py-3.5 text-sm text-gray-400 dark:text-slate-500 text-center">{other}</div>
                <div className="px-5 py-3.5 text-sm font-semibold text-gray-900 dark:text-slate-100 text-center">{us}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Personas */}
      <section className="py-20 bg-gray-50/60 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">Who It&apos;s For</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100">
              Built for curious minds
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { emoji: "👨‍🎓", title: "Students",          desc: "Save lecture notes and study explanations. Review with flashcards before exams." },
              { emoji: "👨‍💼", title: "Professionals",      desc: "Build your personal knowledge base. Never re-research the same topic twice." },
              { emoji: "👨‍💻", title: "Developers",         desc: "Save technical answers and code explanations. Search semantically across your library." },
              { emoji: "📚",  title: "Lifelong Learners", desc: "Curious about everything? Build a library across any topic — science, history, cooking, languages." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-700/20 rounded-2xl p-6 hover:border-amber-400/60 dark:hover:border-amber-600/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all">
                <div className="text-3xl mb-3">{emoji}</div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — only for guests */}
      {!isAuthenticated && <section id="pricing" className="py-20 bg-gray-50/60 dark:bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">Simple, transparent pricing</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-10">Start free. Upgrade when you need more.</p>

          <div className="grid sm:grid-cols-2 gap-6 items-start">
            {/* Free plan */}
            <div className="relative rounded-2xl border-2 border-amber-500/50 dark:border-amber-500/30 bg-white dark:bg-slate-900 p-8 shadow-xl shadow-amber-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="text-xs font-semibold bg-amber-600 text-white px-3 py-1 rounded-full whitespace-nowrap">
                  AWS H0 Hackathon
                </span>
              </div>

              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Free</p>
              <div className="text-5xl font-bold text-gray-900 dark:text-slate-100 mb-1">$0</div>
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">Free during the hackathon period</p>

              <ul className="space-y-3 text-sm text-left mb-8">
                {[
                  "Unlimited AI conversations",
                  "Unlimited Scrolls saved",
                  "Full library & folder search",
                  "Smart AI folder suggestions",
                  "Semantic search (pgvector)",
                  "AWS Aurora + ECS backend",
                  "Share scrolls (public links)",
                  "Export PDF & Markdown",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-gray-600 dark:text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/login?mode=signup"
                className="block w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Create Free Account →
              </Link>
            </div>

            {/* Pro plan */}
            <div className="relative rounded-2xl border-2 border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 opacity-80">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="text-xs font-semibold bg-gray-700 dark:bg-slate-600 text-white px-3 py-1 rounded-full whitespace-nowrap">
                  Coming Soon
                </span>
              </div>

              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3">Pro</p>
              <div className="text-5xl font-bold text-gray-900 dark:text-slate-100 mb-1">$9</div>
              <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">per month · billed monthly</p>

              <ul className="space-y-3 text-sm text-left mb-8">
                {[
                  { text: "Everything in Free", highlight: false },
                  { text: "Priority AI responses (GPT-4o / Claude)", highlight: false },
                  { text: "Study Mode flashcard review", highlight: false },
                  { text: "Advanced folder analytics", highlight: false },
                  { text: "Team collaboration & shared libraries", highlight: false },
                  { text: "Custom AI personas & system prompts", highlight: false },
                  { text: "API access to your scroll library", highlight: false },
                  { text: "Priority support", highlight: false },
                ].map(({ text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-gray-500 dark:text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-[10px] text-gray-400 dark:text-slate-500 font-bold">
                      ✓
                    </span>
                    {text}
                  </li>
                ))}
              </ul>

              <button
                disabled
                className="block w-full py-3 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 rounded-xl font-medium text-sm cursor-not-allowed"
              >
                Notify Me When Available
              </button>
            </div>
          </div>
        </div>
      </section>}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-6 text-center text-xs text-gray-400 dark:text-slate-600">
        ChatScroll · Built for AWS H0 Hackathon · #H0Hackathon
        <span className="mx-2">·</span>
        <Link href="/aws-showcase" className="hover:text-amber-500 dark:hover:text-amber-400 transition-colors">🏗️ AWS Architecture Deep Dive →</Link>
      </footer>
    </div>
  );
}
