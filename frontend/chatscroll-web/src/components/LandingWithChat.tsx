"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrollText, Send, ArrowRight } from "lucide-react";

const SUGGESTIONS = [
  "What are SOLID principles?",
  "How does pgvector work?",
  "Explain async/await in C#",
  "What is Docker?",
];

const STEPS = [
  {
    n: "1",
    title: "Ask any question",
    desc: "Type anything you want to learn — programming, science, medicine, history.",
  },
  {
    n: "2",
    title: "AI gives a concise answer",
    desc: "Get a clear, structured answer from Gemini 2.5 Flash instantly.",
  },
  {
    n: "3",
    title: "Save it as a Scroll forever",
    desc: "Build a personal knowledge library you can search and revisit anytime.",
  },
];

export function LandingWithChat() {
  const [input, setInput] = useState("");
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const q = input.trim();
    if (!q) return;
    sessionStorage.setItem("pendingQuestion", q);
    router.push("/login");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-100 text-sm tracking-tight">ChatScroll</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Brand icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/20 flex items-center justify-center mb-6">
          <ScrollText className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-center mb-3 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
          ChatScroll
        </h1>
        <p className="text-lg text-slate-400 text-center mb-10 max-w-sm">
          Every question becomes lasting knowledge
        </p>

        {/* Chat input */}
        <div className="w-full max-w-2xl">
          <div className="relative bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-slate-950/60 overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything to get started..."
              rows={1}
              className="w-full bg-transparent px-5 pt-4 pb-12 text-slate-200 placeholder-slate-500 text-base resize-none focus:outline-none min-h-[80px] max-h-40"
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 160)}px`;
              }}
            />
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="w-9 h-9 flex items-center justify-center bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 mt-3 justify-center">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setInput(s);
                  textareaRef.current?.focus();
                }}
                className="text-xs text-slate-400 bg-slate-900/70 border border-slate-700/60 rounded-full px-3 py-1.5 hover:text-amber-400 hover:border-amber-500/40 hover:bg-slate-800/60 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl w-full">
          {STEPS.map((step) => (
            <div key={step.n} className="text-center">
              <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-400 text-sm font-bold flex items-center justify-center mx-auto mb-3">
                {step.n}
              </div>
              <p className="text-sm font-medium text-slate-300 mb-1">{step.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium transition-colors group"
          >
            Start for Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </main>
    </div>
  );
}
