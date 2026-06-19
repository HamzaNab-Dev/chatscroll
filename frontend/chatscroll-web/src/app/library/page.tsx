"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Plus,
  X,
  Download,
  BookOpen,
  Zap,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ExportScrollModal } from "@/components/ExportScrollModal";
import { Markdown } from "@/components/ui/markdown";
import { api } from "@/lib/api";
import type { Note, Folder } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const FOLDER_ICONS = ["📁","💻","🔷","🏥","📚","🎓","🔬","💡","🎯","🚀","💼","🎮","🍕","🎵","📝","🌐","🔧","⚡","🧪","📊","🏋️","🌱","🎨","🐍","🦀","☁️"];

type SortKey = "newest" | "oldest" | "title";
type ViewMode = "grid" | "list";

function NoteGridItem({ note, folder, onExport }: { note: Note; folder?: Folder; onExport: (n: Note) => void }) {
  const borderColor = folder?.color ?? "#d97706";
  return (
    <div className="relative group">
      <Link
        href={`/scroll/${note.id}`}
        className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 hover:border-amber-300 dark:hover:border-amber-700/40 hover:shadow-sm transition-all block overflow-hidden cursor-pointer"
        style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
      >
        {folder && (
          <p className="text-[10px] font-medium mb-1.5 truncate pr-7" style={{ color: borderColor }}>
            {folder.icon} {folder.name}
          </p>
        )}
        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors mb-2 pr-7">
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
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onExport(note); }}
        title="Export"
        className="absolute top-2 right-2 z-10 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-600 transition-all shadow-sm"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function NoteListItem({ note, folder, onExport }: { note: Note; folder?: Folder; onExport: (n: Note) => void }) {
  const borderColor = folder?.color ?? "#d97706";
  return (
    <div className="relative group flex items-start border-b border-gray-100 dark:border-slate-800/60 last:border-0" style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}>
      <Link
        href={`/scroll/${note.id}`}
        className="flex-1 flex items-start gap-4 px-4 py-3 hover:bg-amber-50/40 dark:hover:bg-slate-800/30 transition-colors min-w-0"
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
        <div className="flex items-center gap-2 flex-shrink-0 pr-8">
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
      <button
        onClick={() => onExport(note)}
        title="Export"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-600 transition-all shadow-sm flex-shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function FolderSidebar({
  folders,
  notes,
  selectedFolderId,
  onSelect,
  onFolderCreated,
}: {
  folders: Folder[];
  notes: Note[];
  selectedFolderId: string | null;
  onSelect: (id: string | null) => void;
  onFolderCreated?: (folder: Folder) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [newFolderParentId, setNewFolderParentId] = useState<string>("");

  // Derive all counts from the notes array so badges always match filter results
  const countDirect = (folderId: string) =>
    notes.filter((n) => n.folderId === folderId).length;

  const countTotal = (parentId: string) => {
    const childIds = folders.filter((f) => f.parentId === parentId).map((f) => f.id);
    return notes.filter((n) => n.folderId === parentId || childIds.includes(n.folderId)).length;
  };
  const [creatingFolder, setCreatingFolder] = useState(false);

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

  const parentFolders = folders.filter((f) => !f.parentId);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const slug = newFolderName.trim().toLowerCase().replace(/\s+/g, "_");
      const parentFolder = newFolderParentId
        ? folders.find((f) => f.id === newFolderParentId)
        : null;
      const path = parentFolder ? `${parentFolder.path}.${slug}` : slug;

      const created = await api.createFolder({
        name: newFolderName.trim(),
        path,
        icon: newFolderIcon,
        parentId: newFolderParentId || undefined,
      });

      onFolderCreated?.(created);
      onSelect(created.id);
      setShowNewFolder(false);
      setNewFolderName("");
      setNewFolderIcon("📁");
      setNewFolderParentId("");
    } catch {
      // silently skip
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <aside className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-slate-800 flex flex-col">
      <div className="px-3 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          Folders
        </h2>
        <button
          onClick={() => setShowNewFolder((v) => !v)}
          className="p-0.5 rounded text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
          title="New folder"
        >
          {showNewFolder ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* New folder form */}
      {showNewFolder && (
        <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-800 space-y-1.5">
          <div className="flex gap-1.5">
            <span className="text-lg leading-none pt-0.5">{newFolderIcon}</span>
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") { setShowNewFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNewFolderParentId(""); }
              }}
              placeholder="Folder name..."
              className="flex-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>
          {/* Icon picker */}
          <div className="flex flex-wrap gap-1">
            {FOLDER_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setNewFolderIcon(icon)}
                className={cn(
                  "text-sm w-7 h-7 rounded flex items-center justify-center transition-all",
                  newFolderIcon === icon
                    ? "bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-400 dark:ring-amber-600"
                    : "hover:bg-gray-100 dark:hover:bg-slate-700"
                )}
              >
                {icon}
              </button>
            ))}
          </div>
          {parentFolders.length > 0 && (
            <select
              value={newFolderParentId}
              onChange={(e) => setNewFolderParentId(e.target.value)}
              className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-gray-700 dark:text-slate-300 focus:outline-none focus:border-amber-400 appearance-none"
            >
              <option value="">No parent (top level)</option>
              {parentFolders.map((f) => (
                <option key={f.id} value={f.id}>{f.icon ?? "📁"} {f.name}</option>
              ))}
            </select>
          )}
          <button
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim() || creatingFolder}
            className="w-full py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium disabled:opacity-40 transition-colors"
          >
            {creatingFolder ? "Creating..." : "Create folder"}
          </button>
        </div>
      )}

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
          <span className="text-[10px] text-gray-400 dark:text-slate-600">{notes.length}</span>
        </button>

        {/* Parent folders */}
        {parents.map((parent) => {
          const children = getChildren(parent.id);
          const isExpanded = expandedIds.has(parent.id);
          const isSelected = selectedFolderId === parent.id;
          const directCount = countDirect(parent.id);
          const displayCount = countTotal(parent.id);

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
              {isExpanded && (
                <>
                  {/* Virtual "General" node — notes stored directly in this parent folder */}
                  {directCount > 0 && (
                    <button
                      onClick={() => onSelect("__general__" + parent.id)}
                      className={cn(
                        "w-full flex items-center gap-1.5 pl-7 pr-3 py-2 text-sm text-left transition-colors",
                        selectedFolderId === "__general__" + parent.id
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium"
                          : "text-gray-500 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <span className="text-[10px] text-gray-400 dark:text-slate-600">↳</span>
                      <span className="flex-shrink-0 text-xs">📝</span>
                      <span className="flex-1 truncate text-xs">General</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-600 flex-shrink-0">
                        {directCount}
                      </span>
                    </button>
                  )}
                  {children.map((child) => {
                    const childCount = countDirect(child.id);
                    return (
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
                      {childCount > 0 && (
                        <span className="text-[10px] text-gray-400 dark:text-slate-600 flex-shrink-0">
                          {childCount}
                        </span>
                      )}
                    </button>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function StudyMode({ notes, folderMap, onExit }: { notes: Note[]; folderMap: Map<string, Folder>; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const note = notes[index];
  const folder = note ? folderMap.get(note.folderId) : undefined;
  const total = notes.length;

  const prev = () => { setIndex((i) => Math.max(0, i - 1)); setRevealed(false); };
  const next = () => { setIndex((i) => Math.min(total - 1, i + 1)); setRevealed(false); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") prev();
      if (e.key === " ") { e.preventDefault(); setRevealed((v) => !v); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!note) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-slate-200">Study Mode</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 tabular-nums">{index + 1} / {total}</span>
          <button
            onClick={() => { setIndex(0); setRevealed(false); }}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onExit}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-slate-800">
        <div
          className="h-full bg-amber-500 transition-all duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-8 overflow-hidden">
        <div className="w-full max-w-2xl">
          {folder && (
            <p className="text-center text-[11px] font-medium text-amber-500/80 mb-3 tracking-wide">
              {folder.icon ?? "📁"} {folder.name}
            </p>
          )}

          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden cursor-pointer select-none"
            onClick={() => setRevealed((v) => !v)}
          >
            {/* Front — always visible */}
            <div className="px-8 py-7 border-b border-slate-800">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 text-center leading-snug">
                {note.title}
              </h2>
              {note.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  {note.tags.slice(0, 4).map((t) => (
                    <span key={t} className="text-[10px] text-amber-500/70 bg-amber-950/30 border border-amber-700/20 rounded-full px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Back — toggle on click */}
            {!revealed ? (
              <div className="px-8 py-6 text-center">
                <p className="text-sm text-slate-500">Click to reveal answer</p>
                <p className="text-[10px] text-slate-600 mt-1">or press Space</p>
              </div>
            ) : (
              <div className="px-8 py-6 max-h-[50vh] overflow-y-auto">
                <div className="[&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-100 [&_h1]:mb-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-200 [&_h2]:mb-2 [&_h2]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-slate-300 [&_p]:text-slate-300 [&_p]:text-sm [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:text-slate-300 [&_ul]:text-sm [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:text-slate-300 [&_ol]:text-sm [&_ol]:mb-3 [&_li]:mb-1 [&_strong]:text-slate-100 [&_code]:bg-slate-800 [&_code]:text-amber-300 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-slate-800 [&_pre]:rounded-xl [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-amber-600 [&_blockquote]:pl-4 [&_blockquote]:text-slate-400 [&_blockquote]:italic">
                  <Markdown content={note.cleanContent} />
                </div>
                <p className="text-[10px] text-slate-600 text-center mt-4">Click to hide</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 px-6 py-5 border-t border-slate-800">
        <button
          onClick={prev}
          disabled={index === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={() => setRevealed((v) => !v)}
          className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
        >
          {revealed ? "Hide" : "Reveal"}
        </button>
        <button
          onClick={next}
          disabled={index === total - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-700 pb-3">
        ← → navigate · Space reveal · Esc exit
      </p>
    </div>
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
  const [exportNote, setExportNote] = useState<Note | null>(null);
  const [exportCollection, setExportCollection] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  // Semantic search
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword");
  const [semanticResults, setSemanticResults] = useState<Note[] | null>(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const semanticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Debounced semantic search — fires 500ms after the query stops changing
  useEffect(() => {
    if (searchMode !== "semantic") { setSemanticResults(null); return; }
    if (!searchQuery.trim()) { setSemanticResults(null); return; }

    if (semanticTimerRef.current) clearTimeout(semanticTimerRef.current);
    setSemanticLoading(true);
    semanticTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.semanticSearch(searchQuery);
        setSemanticResults(res.results);
      } catch {
        setSemanticResults([]);
      } finally {
        setSemanticLoading(false);
      }
    }, 500);

    return () => {
      if (semanticTimerRef.current) clearTimeout(semanticTimerRef.current);
    };
  }, [searchQuery, searchMode]);

  const folderMap = useMemo(
    () => new Map(folders.map((f) => [f.id, f])),
    [folders]
  );

  // Notes for collection export — folder-filtered but NOT search-filtered, so
  // exporting "Programming" always includes every scroll inside it and its children.
  const folderExportNotes = useMemo(() => {
    if (!selectedFolderId) return allNotes;
    if (selectedFolderId.startsWith("__general__")) {
      const parentId = selectedFolderId.slice("__general__".length);
      return allNotes.filter((n) => n.folderId === parentId);
    }
    const selFolder = folders.find((f) => f.id === selectedFolderId);
    if (selFolder && !selFolder.parentId) {
      const childIds = folders.filter((f) => f.parentId === selectedFolderId).map((f) => f.id);
      return allNotes.filter((n) => n.folderId === selectedFolderId || childIds.includes(n.folderId));
    }
    return allNotes.filter((n) => n.folderId === selectedFolderId);
  }, [allNotes, folders, selectedFolderId]);

  const filtered = allNotes
    .filter((n) => {
      if (selectedFolderId) {
        if (selectedFolderId.startsWith("__general__")) {
          const parentId = selectedFolderId.slice("__general__".length);
          if (n.folderId !== parentId) return false;
        } else {
          const selFolder = folders.find((f) => f.id === selectedFolderId);
          const selIsParent = selFolder && !selFolder.parentId;
          if (selIsParent) {
            const childIds = folders
              .filter((f) => f.parentId === selectedFolderId)
              .map((f) => f.id);
            if (n.folderId !== selectedFolderId && !childIds.includes(n.folderId)) return false;
          } else {
            if (n.folderId !== selectedFolderId) return false;
          }
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

  const selectedFolder = (() => {
    if (!selectedFolderId) return null;
    if (selectedFolderId.startsWith("__general__")) {
      const parentId = selectedFolderId.slice("__general__".length);
      const parent = folders.find((f) => f.id === parentId);
      return parent ? ({ ...parent, name: "General", icon: "📝", id: selectedFolderId } as Folder) : null;
    }
    return folders.find((f) => f.id === selectedFolderId) ?? null;
  })();

  // In semantic mode with a query, use server results; otherwise use local filtered list
  const displayNotes =
    searchMode === "semantic" && searchQuery.trim()
      ? (semanticResults ?? [])
      : filtered;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 flex flex-col">
      <Navigation />

      <div className="flex flex-1 overflow-hidden">
        {/* Folder sidebar */}
        <FolderSidebar
          folders={folders}
          notes={allNotes}
          selectedFolderId={selectedFolderId}
          onSelect={setSelectedFolderId}
          onFolderCreated={(folder) => setFolders((prev) => [...prev, folder])}
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
                  : semanticLoading
                  ? "Searching..."
                  : `${displayNotes.length} scroll${displayNotes.length !== 1 ? "s" : ""}${searchMode === "semantic" && searchQuery.trim() ? " · semantic" : ""}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Study Mode */}
              <button
                onClick={() => setStudyMode(true)}
                disabled={displayNotes.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Enter study / flashcard mode"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Study
              </button>

              {/* Export folder / library */}
              <button
                onClick={() => setExportCollection(true)}
                disabled={folderExportNotes.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40 hover:text-amber-700 dark:hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title={selectedFolder ? `Export ${selectedFolder.name} folder` : "Export full library"}
              >
                <Download className="w-3.5 h-3.5" />
                {selectedFolder ? "Export Folder" : "Export Library"}
              </button>

              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />

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
            <div className="relative flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchMode === "semantic" ? "Semantic search..." : "Search scrolls..."}
                  className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50 transition-colors"
                />
              </div>
              {/* Keyword / Semantic toggle */}
              <button
                onClick={() => {
                  setSearchMode((m) => m === "keyword" ? "semantic" : "keyword");
                  setSemanticResults(null);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                  searchMode === "semantic"
                    ? "bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-600/50 text-amber-700 dark:text-amber-400"
                    : "bg-white dark:bg-slate-900/60 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-600/40"
                )}
                title={searchMode === "semantic" ? "Switch to keyword search" : "Switch to semantic (AI) search"}
              >
                <Zap className="w-3.5 h-3.5" />
                {searchMode === "semantic" ? "Semantic" : "Keyword"}
              </button>
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
          ) : displayNotes.length === 0 ? (
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
              {displayNotes.map((note) => (
                <NoteGridItem
                  key={note.id}
                  note={note}
                  folder={folderMap.get(note.folderId)}
                  onExport={setExportNote}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
              {displayNotes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  folder={folderMap.get(note.folderId)}
                  onExport={setExportNote}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {studyMode && displayNotes.length > 0 && (
        <StudyMode
          notes={displayNotes}
          folderMap={folderMap}
          onExit={() => setStudyMode(false)}
        />
      )}

      {exportNote && (
        <ExportScrollModal
          note={exportNote}
          folder={folders.find((f) => f.id === exportNote.folderId)}
          onClose={() => setExportNote(null)}
        />
      )}

      {exportCollection && (
        <ExportScrollModal
          notes={folderExportNotes}
          collectionTitle={selectedFolder
            ? `${selectedFolder.icon ?? "📁"} ${selectedFolder.name}`
            : "📚 ChatScroll Library"}
          folderMap={folderMap}
          onClose={() => setExportCollection(false)}
        />
      )}
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
