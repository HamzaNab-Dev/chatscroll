"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Search, LayoutGrid, List, ScrollText, SortAsc, SortDesc } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Note, Folder } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "oldest" | "title";
type ViewMode = "grid" | "list";

function NoteGridItem({ note }: { note: Note }) {
  return (
    <Link
      href={`/scroll/${note.id}`}
      className="group rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 hover:border-amber-300 dark:hover:border-amber-700/40 hover:shadow-sm transition-all block"
    >
      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors mb-2">
        {note.title}
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-3 mb-3">
        {note.cleanContent.replace(/[#*`]/g, "").slice(0, 120)}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[10px] text-gray-400 dark:text-slate-600">
          {formatDate(note.createdAt)}
        </span>
        <div className="flex gap-1 flex-wrap justify-end">
          {note.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-full px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function NoteListItem({ note }: { note: Note }) {
  return (
    <Link
      href={`/scroll/${note.id}`}
      className="group flex items-start gap-4 px-4 py-3 border-b border-gray-100 dark:border-slate-800/60 hover:bg-amber-50/40 dark:hover:bg-slate-800/30 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
          {note.title}
        </p>
        <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">
          {note.cleanContent.replace(/[#*`]/g, "").slice(0, 80)}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {note.tags.slice(0, 1).map((tag) => (
          <span
            key={tag}
            className="text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-full px-1.5 py-0.5 hidden sm:block"
          >
            {tag}
          </span>
        ))}
        <span className="text-[10px] text-gray-400 dark:text-slate-600 whitespace-nowrap">
          {formatDate(note.createdAt)}
        </span>
      </div>
    </Link>
  );
}

function LibraryContent() {
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortAsc, setSortAsc] = useState(false);

  const load = useCallback(async () => {
    try {
      const [notesData, foldersData] = await Promise.all([
        api.getAllNotes(),
        api.getFolders(),
      ]);
      setAllNotes(notesData);
      setFolders(foldersData);
    } catch {
      // silently continue
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Sort folders into hierarchy: each parent followed immediately by its children
  const sortedFolders = useMemo((): (Folder & { isChild: boolean })[] => {
    const parents = folders.filter((f) => !f.parentId);
    const result: (Folder & { isChild: boolean })[] = [];
    for (const parent of parents) {
      result.push({ ...parent, isChild: false });
      folders
        .filter((f) => f.parentId === parent.id)
        .forEach((child) => result.push({ ...child, isChild: true }));
    }
    // Orphaned folders (parentId set but parent not in list)
    const seen = new Set(result.map((f) => f.id));
    folders
      .filter((f) => !seen.has(f.id))
      .forEach((f) => result.push({ ...f, isChild: !!f.parentId }));
    return result;
  }, [folders]);

  // Parent tab count = own notes + all direct children's notes combined
  const getDisplayCount = (folder: Folder, isChild: boolean): number => {
    if (isChild) return folder.noteCount;
    const childCount = folders
      .filter((f) => f.parentId === folder.id)
      .reduce((sum, f) => sum + f.noteCount, 0);
    return folder.noteCount + childCount;
  };

  // When a parent folder is selected, include notes from all its child folders
  const filtered = allNotes
    .filter((n) => {
      if (selectedFolderId) {
        const selectedFolder = folders.find((f) => f.id === selectedFolderId);
        const selectedIsParent = selectedFolder && !selectedFolder.parentId;
        if (selectedIsParent) {
          const childIds = folders
            .filter((f) => f.parentId === selectedFolderId)
            .map((f) => f.id);
          if (n.folderId !== selectedFolderId && !childIds.includes(n.folderId)) return false;
        } else {
          if (n.folderId !== selectedFolderId) return false;
        }
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.cleanContent.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "newest") cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else if (sortKey === "oldest") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else cmp = a.title.localeCompare(b.title);
      return sortAsc ? -cmp : cmp;
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-amber-500" />
              Scroll Library
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              {loading ? "Loading..." : `${allNotes.length} scroll${allNotes.length !== 1 ? "s" : ""} saved`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "grid"
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  : "text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                viewMode === "list"
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400"
                  : "text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300"
              )}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search scrolls..."
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50 transition-colors"
            />
          </div>

          <div className="flex gap-2 pr-1">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="px-3 py-2.5 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50 transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title">Title</option>
            </select>

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-2.5 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40 transition-colors"
              aria-label="Toggle sort direction"
            >
              {sortAsc ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Folder filter tabs — hierarchical */}
        {folders.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                !selectedFolderId
                  ? "bg-amber-600 text-white"
                  : "bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40"
              )}
            >
              All
            </button>

            {sortedFolders.map((item) => {
              const displayCount = getDisplayCount(item, item.isChild);
              return (
                <button
                  key={item.id}
                  onClick={() =>
                    setSelectedFolderId(item.id === selectedFolderId ? null : item.id)
                  }
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    item.isChild && "ml-3",
                    selectedFolderId === item.id
                      ? "bg-amber-600 text-white"
                      : "bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40"
                  )}
                >
                  {item.isChild && (
                    <span className="text-[10px] opacity-50 mr-0.5">↳</span>
                  )}
                  <span>{item.icon ?? "📁"}</span>
                  <span className={item.isChild ? "text-[11px]" : ""}>{item.name}</span>
                  {displayCount > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 ml-0.5",
                        selectedFolderId === item.id
                          ? "bg-white/20"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-500"
                      )}
                    >
                      {displayCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 animate-pulse"
              >
                <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-full mb-1.5" />
                <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-2/3 mb-1.5" />
                <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ScrollText className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-slate-500">
              {searchQuery ? `No scrolls matching "${searchQuery}"` : "No scrolls yet"}
            </p>
            {!searchQuery && (
              <Link
                href="/chat"
                className="mt-3 inline-block text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium"
              >
                Start chatting to create scrolls →
              </Link>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((note) => (
              <NoteGridItem key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
            {filtered.map((note) => (
              <NoteListItem key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <LibraryContent />
    </ProtectedRoute>
  );
}
