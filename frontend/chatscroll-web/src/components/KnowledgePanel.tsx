"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ScrollText, FolderOpen, Brain, Zap } from "lucide-react";
import { FolderTree } from "@/components/FolderTree";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Folder, Note, WeeklyActivity } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface KnowledgePanelProps {
  folders: Folder[];
  refreshKey: number;
}

type PanelView = "tree" | "notes";

function SkeletonNote() {
  return (
    <div className="px-3 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/20 animate-pulse">
      <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
      <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-full mb-1" />
      <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
    </div>
  );
}

function SkeletonFolder() {
  return (
    <div className="flex items-center gap-2 px-2 py-2 animate-pulse">
      <div className="w-4 h-4 bg-gray-200 dark:bg-slate-800 rounded flex-shrink-0" />
      <div className="h-3 bg-gray-100 dark:bg-slate-700 rounded flex-1" />
    </div>
  );
}

function WeeklyStatsBar({ data }: { data: WeeklyActivity[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-600" />
          This week
        </span>
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{total} scrolls</span>
      </div>
      <div className="flex items-end gap-1 h-10">
        {data.map((day) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="w-full bg-amber-400/60 dark:bg-amber-500/50 hover:bg-amber-500/80 dark:hover:bg-amber-400/70 rounded-t-sm transition-all duration-500 cursor-default"
              style={{ height: `${Math.max(2, (day.count / max) * 32)}px` }}
              title={`${day.dayLabel}: ${day.count} scroll${day.count !== 1 ? "s" : ""}`}
            />
            <span className="text-[10px] text-gray-400 dark:text-slate-600">{day.dayLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function KnowledgePanel({ folders, refreshKey }: KnowledgePanelProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [view, setView] = useState<PanelView>("tree");
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Note[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyActivity[] | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd+K focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === searchRef.current) {
        setSearchQuery("");
        searchRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      setLoadingNotes(true);
      // Virtual "General" node (icon "📝") represents notes stored directly in the parent —
      // fetch only that folder's direct notes, not its children's.
      const isVirtualGeneral = selectedFolder.icon === "📝";
      const childFolders = isVirtualGeneral ? [] : folders.filter((f) => f.parentId === selectedFolder.id);
      const folderIds = [selectedFolder.id, ...childFolders.map((f) => f.id)];
      Promise.all(folderIds.map((id) => api.getNotesByFolder(id)))
        .then((results) => setNotes(results.flat()))
        .catch(console.error)
        .finally(() => setLoadingNotes(false));
    }
  }, [selectedFolder, refreshKey, folders]);

  const loadStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const stats = await api.getNotesStats();
      setWeeklyStats(stats.weeklyActivity);
    } catch {
      // silently skip
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadStats();
  }, [loadStats, refreshKey]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await api.searchNotes(searchQuery);
        setSearchResults(results);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFolderSelect = (folder: Folder) => {
    setSelectedFolder(folder);
    setView("notes");
    setSearchQuery("");
  };

  const totalNotes = folders.reduce((sum, f) => sum + f.noteCount, 0);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-transparent">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800">
          <ScrollText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <h2 className="text-sm font-medium text-gray-800 dark:text-slate-200">Your Scrolls</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/30 flex items-center justify-center mb-4">
            <ScrollText className="w-7 h-7 text-amber-500 dark:text-amber-600/80" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Sign in to save Scrolls</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-5 max-w-[160px]">
            Build your personal knowledge library — save answers as scrolls
          </p>
          <Link
            href="/login"
            className="text-xs px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-transparent">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800">
        <ScrollText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        <h2 className="text-sm font-medium text-gray-800 dark:text-slate-200">Your Scrolls</h2>
        <div className="ml-auto flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
          <span>📜</span>
          <span>{totalNotes} saved</span>
        </div>
      </div>

      <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search scrolls..."
            className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-lg pl-8 pr-16 py-2 text-xs text-gray-700 dark:text-slate-300 placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/40 transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-slate-600 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded px-1 py-0.5 hidden sm:block">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {searchQuery && (
          <div className="p-3 space-y-1">
            <p className="text-xs text-gray-400 dark:text-slate-500 px-1 mb-2">
              {searching ? "Searching..." : `${searchResults.length} scroll${searchResults.length !== 1 ? "s" : ""} found`}
            </p>
            {searchResults.length === 0 && !searching && (
              <div className="text-center py-6">
                <Search className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-slate-700" />
                <p className="text-xs text-gray-500 dark:text-slate-600">
                  No scrolls found for &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-700 mt-1">
                  Ask the AI about this topic to create a scroll
                </p>
              </div>
            )}
            {/* Fix 1: navigate to /scroll/[id] instead of opening NoteViewer */}
            {searchResults.map((note) => (
              <button
                key={note.id}
                onClick={() => router.push(`/scroll/${note.id}`)}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-slate-800/60 transition-all"
              >
                <p className="text-sm text-gray-800 dark:text-slate-200 truncate">{note.title}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {formatDate(note.createdAt)}
                </p>
              </button>
            ))}
          </div>
        )}

        {!searchQuery && view === "notes" && selectedFolder && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3 px-1">
              <button
                onClick={() => setView("tree")}
                className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
              >
                ← Back
              </button>
              <span className="text-xs text-gray-300 dark:text-slate-500">·</span>
              <span className="text-xs text-gray-500 dark:text-slate-400">
                {selectedFolder.icon} {selectedFolder.name}
              </span>
            </div>

            {loadingNotes && (
              <div className="space-y-2">
                <SkeletonNote />
                <SkeletonNote />
                <SkeletonNote />
              </div>
            )}

            {!loadingNotes && notes.length === 0 && (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3">
                  <FolderOpen className="w-6 h-6 text-gray-400 dark:text-slate-600" />
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">No scrolls yet</p>
                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 max-w-[180px] mx-auto">
                  Ask something in the chat and save the answer here
                </p>
              </div>
            )}

            {!loadingNotes && notes.length > 0 && (
              <div className="space-y-2">
                {notes.map((note) => (
                  /* Fix 1: navigate to /scroll/[id] instead of NoteViewer */
                  <button
                    key={note.id}
                    onClick={() => router.push(`/scroll/${note.id}`)}
                    className="w-full text-left px-3 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/40 hover:border-amber-300 dark:hover:border-amber-500/30 hover:bg-amber-50/50 dark:hover:bg-slate-800/60 transition-all group"
                  >
                    <p className="text-sm text-gray-800 dark:text-slate-200 font-medium truncate group-hover:text-amber-700 dark:group-hover:text-amber-200 transition-colors">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 line-clamp-2">
                      {(() => { const t = note.cleanContent.replace(/[#*`_>]/g, "").replace(/\s+/g, " ").trim(); if (t.length <= 90) return t; const cut = t.slice(0, 90); const s = cut.lastIndexOf(" "); return (s > 0 ? cut.slice(0, s) : cut) + "..."; })()}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {note.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="text-xs border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500 py-0"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!searchQuery && view === "tree" && (
          <div className="p-3">
            {folders.length === 0 && (
              <div>
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-gradient-to-br dark:from-amber-900/40 dark:to-slate-800/60 border border-amber-200 dark:border-amber-800/30 flex items-center justify-center mx-auto mb-3">
                    <Brain className="w-7 h-7 text-amber-500 dark:text-amber-600/70" />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-400 font-medium">
                    Your Scroll Library is empty
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 max-w-[180px] mx-auto">
                    Ask a question in the chat — AI will suggest where to save the answer
                  </p>
                </div>
                <div className="mt-2 space-y-0.5 opacity-30">
                  <SkeletonFolder />
                  <SkeletonFolder />
                  <SkeletonFolder />
                </div>
              </div>
            )}

            {folders.length > 0 && (
              <FolderTree
                folders={folders}
                onFolderSelect={handleFolderSelect}
                selectedFolderId={selectedFolder?.id}
              />
            )}
          </div>
        )}
      </div>

      {!searchQuery && view === "tree" && weeklyStats && weeklyStats.length > 0 && (
        <WeeklyStatsBar data={weeklyStats} />
      )}
    </div>
  );
}
