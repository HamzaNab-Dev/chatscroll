"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  ScrollText,
  SortAsc,
  SortDesc,
  ChevronDown,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Note, Folder } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

type SortKey = "newest" | "oldest" | "title";
type ViewMode = "grid" | "list";

function NoteGridItem({ note, folder }: { note: Note; folder?: Folder }) {
  const borderColor = folder?.color ?? "#d97706";
  return (
    <Link
      href={`/scroll/${note.id}`}
      className="group rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 hover:border-amber-300 dark:hover:border-amber-700/40 hover:shadow-sm transition-all block overflow-hidden cursor-pointer"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
    >
      {folder && (
        <p className="text-[10px] font-medium mb-1.5 truncate" style={{ color: borderColor }}>
          {folder.icon} {folder.name}
        </p>
      )}
      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors mb-2">
        {note.title}
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-2 mb-3">
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

function NoteListItem({ note, folder }: { note: Note; folder?: Folder }) {
  const borderColor = folder?.color ?? "#d97706";
  return (
    <Link
      href={`/scroll/${note.id}`}
      className="group flex items-start gap-4 px-4 py-3 border-b border-gray-100 dark:border-slate-800/60 hover:bg-amber-50/40 dark:hover:bg-slate-800/30 transition-colors"
      style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
    >
      <div className="flex-1 min-w-0">
        {folder && (
          <p className="text-[10px] font-medium mb-0.5 truncate" style={{ color: borderColor }}>
            {folder.icon} {folder.name}
          </p>
        )}
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

function FolderSidebar({
  folders,
  selectedFolderId,
  onSelect,
  totalCount,
}: {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelect: (id: string | null) => void;
  totalCount: number;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const parents = folders.filter((f) => !f.parentId);
  const getChildren = (parentId: string) => folders.filter((f) => f.parentId === parentId);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <aside className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-slate-800 flex flex-col">
      <div className="px-3 py-3 border-b border-gray-200 dark:border-slate-800">
        <h2 className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          Folders
        </h2>
      </div>

      <nav className="flex-1 overflow-y-auto py-1">
        {/* All Scrolls */}
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left",
            !selectedFolderId
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium"
              : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
          )}
        >
          <ScrollText className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 truncate">All Scrolls</span>
          <span className="text-[10px] text-gray-400 dark:text-slate-600">{totalCount}</span>
        </button>

        {/* Parent folders */}
        {parents.map((parent) => {
          const children = getChildren(parent.id);
          const isExpanded = expandedIds.has(parent.id);
          const isSelected = selectedFolderId === parent.id;
          const childCount = children.reduce((s, c) => s + c.noteCount, 0);
          const displayCount = parent.noteCount + childCount;

          return (
            <div key={parent.id}>
              <div
                className={cn(
                  "flex items-center transition-colors",
                  isSelected
                    ? "bg-amber-50 dark:bg-amber-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-slate-800/50"
                )}
              >
                {children.length > 0 ? (
                  <button
                    onClick={() => toggleExpand(parent.id)}
                    className="flex-shrink-0 p-1 pl-2 text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                ) : (
                  <div className="w-6 flex-shrink-0" />
                )}
                <button
                  onClick={() => onSelect(parent.id)}
                  className={cn(
                    "flex-1 flex items-center gap-2 py-2 pr-3 text-sm text-left",
                    isSelected
                      ? "text-amber-700 dark:text-amber-300 font-medium"
                      : "text-gray-600 dark:text-slate-400"
                  )}
                >
                  <span className="flex-shrink-0">{parent.icon ?? "📁"}</span>
                  <span className="flex-1 truncate">{parent.name}</span>
                  {displayCount > 0 && (
                    <span className="text-[10px] text-gray-400 dark:text-slate-600 flex-shrink-0">
                      {displayCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Children */}
              {isExpanded &&
                children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => onSelect(child.id)}
                    className={cn(
                      "w-full flex items-center gap-1.5 pl-7 pr-3 py-2 text-sm text-left transition-colors",
                      selectedFolderId === child.id
                        ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium"
                        : "text-gray-500 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <span className="text-[10px] text-gray-400 dark:text-slate-600">↳</span>
                    <span className="flex-shrink-0 text-xs">{child.icon ?? "📁"}</span>
                    <span className="flex-1 truncate text-xs">{child.name}</span>
                    {child.noteCount > 0 && (
                      <span className="text-[10px] text-gray-400 dark:text-slate-600 flex-shrink-0">
                        {child.noteCount}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          );
        })}
      </nav>
    </aside>
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

  const folderMap = useMemo(
    () => new Map(folders.map((f) => [f.id, f])),
    [folders]
  );

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
      if (sortKey === "newest")
        cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      else if (sortKey === "oldest")
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else cmp = a.title.localeCompare(b.title);
      return sortAsc ? -cmp : cmp;
    });

  const selectedFolder = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex flex-col">
      <Navigation />

      <div className="flex flex-1 overflow-hidden">
        {/* Folder sidebar */}
        <FolderSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelect={setSelectedFolderId}
          totalCount={allNotes.length}
        />

        {/* Main area */}
        <main className="flex-1 min-w-0 px-5 py-6 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-amber-500" />
                {selectedFolder
                  ? `${selectedFolder.icon ?? "📁"} ${selectedFolder.name}`
                  : "Scroll Library"}
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {loading
                  ? "Loading..."
                  : `${filtered.length} scroll${filtered.length !== 1 ? "s" : ""}`}
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
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scrolls..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="appearance-none pl-3 pr-8 py-2 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50 transition-colors cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title">Title</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-slate-500 pointer-events-none" />
              </div>

              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="p-2 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40 transition-colors"
                aria-label="Toggle sort direction"
              >
                {sortAsc ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>
            </div>
          </div>

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
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ScrollText className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-slate-500">
                {searchQuery
                  ? `No scrolls matching "${searchQuery}"`
                  : selectedFolder
                  ? `No scrolls in ${selectedFolder.name} yet`
                  : "No scrolls yet"}
              </p>
              {!searchQuery && selectedFolder && (
                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
                  Chat about {selectedFolder.name.toLowerCase()} and save answers here
                </p>
              )}
              <Link
                href="/chat"
                className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium border border-amber-200 dark:border-amber-700/40 rounded-lg px-3 py-1.5 transition-colors"
              >
                <MessageSquare className="w-3 h-3" />
                {selectedFolder
                  ? `Chat about ${selectedFolder.name} →`
                  : "Start chatting →"}
              </Link>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((note) => (
                <NoteGridItem
                  key={note.id}
                  note={note}
                  folder={folderMap.get(note.folderId)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
              {filtered.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  folder={folderMap.get(note.folderId)}
                />
              ))}
            </div>
          )}
        </main>
      </div>
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
