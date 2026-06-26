"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Tag,
  Calendar,
  Eye,
  Copy,
  Trash2,
  Check,
  ScrollText,
  Link2,
  FolderOpen,
  Download,
  Share2,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Markdown } from "@/components/ui/markdown";
import { ExportScrollModal } from "@/components/ExportScrollModal";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Note, Folder } from "@/lib/api";
import { formatDate } from "@/lib/utils";

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\w]*\n?([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_{2}([^_]+)_{2}/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^[-*+]\s+/gm, "• ")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/^>\s*/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[-*_]{3,}$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ScrollDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = searchParams.get("from") === "chat" ? "/chat" : "/library";
  const backLabel = searchParams.get("from") === "chat" ? "Back to Chat" : "Back to Library";
  const [note, setNote] = useState<Note | null>(null);
  const [relatedNotes, setRelatedNotes] = useState<Array<{ id: string; title: string; folderPath?: string; folderIcon?: string; preview: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [moving, setMoving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [shared, setShared] = useState(false);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!params?.id) return;
    try {
      const [noteData, foldersData] = await Promise.all([
        api.getNoteById(params.id),
        api.getFolders(),
      ]);
      setNote(noteData);
      setFolders(foldersData);

      // Increment view count (fire-and-forget)
      api.incrementViewCount(params.id).catch(() => {});

      // Fetch semantically similar notes via pgvector (fire-and-forget; silently empty on miss)
      api.getRelatedNotes(params.id).then(setRelatedNotes).catch(() => {});
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
    if (!note) return;
    await navigator.clipboard.writeText(stripMarkdown(note.cleanContent));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!note || !confirm("Delete this scroll? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.deleteNote(note.id);
      router.push(backHref);
    } catch {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!showMoveMenu) return;
    const handler = (e: MouseEvent) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMoveMenu]);

  const handleMove = async (folderId: string) => {
    if (!note || moving) return;
    setMoving(true);
    setShowMoveMenu(false);
    try {
      const updated = await api.updateNote(note.id, { folderId });
      setNote(updated);
    } finally {
      setMoving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded w-24" />
            <div className="h-7 bg-gray-200 dark:bg-slate-800 rounded w-2/3" />
            <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-1/3" />
            <div className="h-64 bg-gray-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !note) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
        <Navigation />
        <main className="max-w-3xl mx-auto px-4 py-16 sm:px-6 text-center">
          <ScrollText className="w-10 h-10 mx-auto mb-4 text-gray-300 dark:text-slate-600" />
          <h1 className="text-lg font-semibold text-gray-700 dark:text-slate-300 mb-2">
            Scroll not found
          </h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mb-6">
            This scroll may have been deleted or doesn't exist.
          </p>
          <Link
            href="/library"
            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium"
          >
            ← Back to Library
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
        {/* Back nav */}
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>

        {/* Title + actions — buttons above title on mobile, side-by-side on md+ */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
          <div className="order-1 md:order-2 flex items-center gap-2 flex-wrap flex-shrink-0">
            <button
              onClick={handleCopy}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              title="Copy content"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>

            <button
              onClick={() => setShowExport(true)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              title="Export scroll"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>

            <button
              onClick={async () => {
                const url = `${window.location.origin}/shared/${note.id}`;
                await navigator.clipboard.writeText(url);
                setShared(true);
                setTimeout(() => setShared(false), 2500);
              }}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              title="Copy share link"
            >
              {shared ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              {shared ? "Copied!" : "Share"}
            </button>

            {/* Move to folder */}
            <div className="relative flex-shrink-0" ref={moveMenuRef}>
              <button
                onClick={() => setShowMoveMenu((v) => !v)}
                disabled={moving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40 hover:text-amber-700 dark:hover:text-amber-300 transition-colors disabled:opacity-50"
                title="Move to folder"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                {moving ? "Moving..." : "Move"}
              </button>
              {showMoveMenu && (
                <div className="absolute left-0 md:right-0 md:left-auto top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg py-1 min-w-[180px] max-h-60 overflow-y-auto">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => handleMove(folder.id)}
                      disabled={folder.id === note.folderId}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                        folder.id === note.folderId
                          ? "text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20"
                          : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                      style={{ paddingLeft: folder.parentId ? "24px" : undefined }}
                    >
                      <span>{folder.icon ?? "📁"}</span>
                      <span className="flex-1 truncate">{folder.name}</span>
                      {folder.id === note.folderId && (
                        <Check className="w-3 h-3 flex-shrink-0 text-amber-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-red-200 dark:border-red-900/40 text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-800/50 transition-colors disabled:opacity-50"
              title="Delete scroll"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
          <h1 className="order-2 md:order-1 text-xl font-bold text-gray-900 dark:text-slate-100 leading-snug flex-1">
            {note.title}
          </h1>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(note.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {note.viewCount} view{note.viewCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tags */}
        {note.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-5">
            <Tag className="w-3 h-3 text-gray-400 dark:text-slate-500" />
            {note.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs border-gray-300 dark:border-slate-700 text-gray-500 dark:text-slate-400"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Original question */}
        {note.originalQuestion && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 mb-5">
            <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Original question</p>
            <p className="text-sm text-gray-700 dark:text-slate-300">{note.originalQuestion}</p>
          </div>
        )}

        {/* Content */}
        <div className="rounded-xl bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 p-5 mb-8">
          <Markdown content={note.cleanContent} />
        </div>

        {showExport && note && (
          <ExportScrollModal
            note={note}
            folder={folders.find((f) => f.id === note.folderId)}
            onClose={() => setShowExport(false)}
          />
        )}

        {/* Related Scrolls — powered by pgvector cosine similarity */}
        {relatedNotes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Link2 className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
              <h2 className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                Related Scrolls
              </h2>
              <span className="text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-full px-2 py-0.5 ml-1">
                pgvector
              </span>
            </div>
            <div className="space-y-2">
              {relatedNotes.map((related) => (
                <Link
                  key={related.id}
                  href={`/scroll/${related.id}`}
                  className="group flex items-start gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/30 hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-slate-800/60 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-slate-300 truncate group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors">
                      {related.title}
                    </p>
                    {related.preview && (
                      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                        {related.preview}
                      </p>
                    )}
                    {related.folderPath && (
                      <p className="text-[10px] text-amber-600/70 dark:text-amber-500/60 mt-1 truncate">
                        {related.folderIcon ?? "📁"} {related.folderPath.replace(/\./g, " › ")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ScrollDetailPage() {
  return (
    <ProtectedRoute>
      <ScrollDetailContent />
    </ProtectedRoute>
  );
}
