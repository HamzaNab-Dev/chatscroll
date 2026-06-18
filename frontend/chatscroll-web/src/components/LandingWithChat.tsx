"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ScrollText, Send, Loader2, ArrowRight, ChevronDown } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { api } from "@/lib/api";

const SUGGESTIONS = [
  "SOLID principles?",
  "How does Docker work?",
  "Explain async/await",
  "What is pgvector?",
];

export function LandingWithChat() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [used, setUsed] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem("previewUsed")) setUsed(true);
  }, []);

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q || loading || used) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.previewChat(q);
      setAnswer(response.answer);
      setUsed(true);
      sessionStorage.setItem("previewUsed", "1");
      setTimeout(
        () => answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100
      );
    } catch {
      setError("Could not reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    const q = question.trim();
    if (q) sessionStorage.setItem("pendingQuestion", q);
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-100 text-sm tracking-tight">ChatScroll</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-slate-200 transition-colors">How it works</a>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
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
      </header>

      {/* Hero */}
      <section className="max-w-2xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
          <ScrollText className="w-8 h-8 text-white" />
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-100 mb-3 tracking-tight">
          ChatScroll
        </h1>
        <p className="text-lg text-slate-400 mb-8">
          Every question becomes lasting knowledge
        </p>

        {/* Chat box */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={
              used
                ? "Sign up to ask more questions..."
                : "Ask anything... (no login needed to try)"
            }
            disabled={loading || used}
            rows={2}
            className="w-full bg-transparent px-5 py-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none resize-none disabled:opacity-60"
          />
          <div className="flex items-center justify-end px-4 pb-3">
            <button
              onClick={handleSubmit}
              disabled={!question.trim() || loading || used}
              className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center disabled:opacity-40 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        {/* Suggestions */}
        {!answer && !loading && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <span className="text-xs text-slate-600 self-center">Try:</span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuestion(s);
                  textareaRef.current?.focus();
                }}
                disabled={used}
                className="text-xs px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:border-amber-500/40 hover:text-amber-400 transition-colors disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* CTAs (shown when no answer yet) */}
        {!answer && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href="/login"
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              Start for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="px-6 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-200 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              See How It Works <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        )}

        {/* AI Response */}
        {answer && (
          <div ref={answerRef} className="mt-6 text-left">
            <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                  AI
                </div>
                <span className="text-xs text-slate-500">ChatScroll AI</span>
              </div>
              <div className="text-sm text-slate-300 leading-relaxed">
                <Markdown content={answer} />
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-950/30 border border-amber-500/20 rounded-xl text-center">
              <p className="text-sm text-amber-300 font-medium mb-1">
                💾 Want to save this answer?
              </p>
              <p className="text-xs text-slate-500 mb-3">
                Create a free account to save scrolls to your personal library
              </p>
              <button
                onClick={handleSignUp}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Create Free Account →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Stats bar */}
      <div className="border-y border-slate-800 bg-slate-900/50 py-4">
        <div className="max-w-2xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
          <span>📜 Save Scrolls</span>
          <span className="text-slate-700">•</span>
          <span>🔍 Search Instantly</span>
          <span className="text-slate-700">•</span>
          <span>🧠 Never Forget</span>
        </div>
      </div>

      {/* How it works */}
      <section id="how-it-works" className="max-w-3xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-slate-100 text-center mb-12">How It Works</h2>
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
              <h3 className="font-semibold text-slate-200 mb-2">{title}</h3>
              <p className="text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-900/30 py-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-100 text-center mb-12">Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "🧠", title: "AI-Powered", desc: "Ask anything, get smart answers powered by Gemini 2.5 Flash" },
              { icon: "📚", title: "Scroll Library", desc: "All your saved knowledge in one searchable place" },
              { icon: "🔍", title: "Smart Search", desc: "Find any scroll instantly with semantic search" },
              { icon: "📁", title: "Organized", desc: "Auto-categorized into folders & sub-folders" },
              { icon: "💡", title: "Already Know?", desc: "Detects if you've researched this topic before" },
              { icon: "⚡", title: "Lightning Fast", desc: "Built on Aurora PostgreSQL + AWS infrastructure" },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/20 transition-colors"
              >
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-semibold text-slate-200 mb-1 text-sm">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-100 mb-3">
          Start building your knowledge library today
        </h2>
        <p className="text-slate-500 mb-8 text-sm">
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
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-600">
        ChatScroll · Built for AWS H0 Hackathon · #H0Hackathon
      </footer>
    </div>
  );
}
