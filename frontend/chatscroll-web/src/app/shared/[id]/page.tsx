"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ScrollText, Tag, Calendar, ArrowRight, Copy, Check } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { api } from "@/lib/api";
import type { SharedNote } from "@/lib/api";

function folderBreadcrumb(path: string): string {
  return path
    .split(".")
    .map((s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" → ");
}

export default function SharedScrollPage() {
  const params = useParams<{ id: string }>();
  const [note, setNote] = useState<SharedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    if (!params?.id) return;
    try {
      const data = await api.getSharedNote(params.id);
      setNote(data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [params?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !note) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex flex-col items-center justify-center px-6">
        <ScrollText className="w-12 h-12 text-gray-300 dark:text-slate-600 mb-4" />
        <h1 className="text-lg font-semibold mb-2">Scroll not found</h1>
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-6 text-center">
          This scroll may have been removed or the link is incorrect.
        </p>
        <Link href="/" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">
          Go to ChatScroll →
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {/* Minimal public nav */}
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="ChatScroll" width={26} height={26} className="rounded-md" />
            <span className="font-bold text-sm text-gray-900 dark:text-slate-100">ChatScroll</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
            >
              Save your own Scrolls <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 sm:px-6">
        {/* Shared badge */}
        <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/40 rounded-full px-3 py-1 mb-5">
          📜 Shared Scroll from ChatScroll
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3 leading-tight">
          {note.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-slate-500 mb-4">
          {note.folderPath && (
            <span className="flex items-center gap-1">
              <span>{note.folderIcon ?? "📁"}</span>
              <span>{folderBreadcrumb(note.folderPath)}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(note.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {note.viewCount > 0 && (
            <span>{note.viewCount} view{note.viewCount !== 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-6">
            <Tag className="w-3 h-3 text-gray-400 dark:text-slate-500" />
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 rounded-full px-2.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 p-6 sm:p-8 mb-10">
          <Markdown content={note.cleanContent} />
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-700/30 bg-amber-50/60 dark:bg-amber-950/10 p-6 text-center">
          <div className="text-2xl mb-2">📚</div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-1">
            Build your own knowledge library
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Ask AI anything, save the best answers as Scrolls — organized, searchable, always at hand.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Start for free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 dark:border-slate-800 py-5 text-center text-xs text-gray-400 dark:text-slate-600">
        ChatScroll · AI-powered knowledge that sticks
      </footer>
    </div>
  );
}
