"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, X } from "lucide-react";
import type { Folder, FolderSuggestion } from "@/lib/api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SaveNoteModalProps {
  question: string;
  cleanNote: string;
  folderSuggestion: FolderSuggestion;
  folders: Folder[];
  onSave: (folderId: string, title: string) => Promise<void>;
  onDismiss: () => void;
}

function formatPath(path: string): string {
  return path
    .split(".")
    .map((p) =>
      p
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(" → ");
}

export function SaveNoteModal({
  question,
  cleanNote: _cleanNote,
  folderSuggestion,
  folders,
  onSave,
  onDismiss,
}: SaveNoteModalProps) {
  const [localFolders, setLocalFolders] = useState<Folder[]>(folders);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showAllFolders, setShowAllFolders] = useState(false);

  // New folder form state
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string>("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    setLocalFolders(folders);
  }, [folders]);

  const suggestedFolder = localFolders.find(
    (f) => f.path === folderSuggestion.suggestedPath
  );

  const activeFolder = selectedFolderId
    ? localFolders.find((f) => f.id === selectedFolderId)
    : suggestedFolder;

  // If active folder is a parent that has children, show "→ General" suffix
  const activeFolderHasChildren = localFolders.some((f) => f.parentId === activeFolder?.id);

  const folderLabel = activeFolder
    ? activeFolderHasChildren
      ? formatPath(activeFolder.path) + " → General"
      : formatPath(activeFolder.path)
    : formatPath(folderSuggestion.suggestedPath);

  const handleSave = async () => {
    const folderId = selectedFolderId || suggestedFolder?.id || localFolders[0]?.id;
    if (!folderId) return;
    setSaving(true);
    try {
      const title = question.length > 60 ? question.slice(0, 60) + "..." : question;
      await onSave(folderId, title);
    } finally {
      setSaving(false);
    }
  };

  const parentFolders = localFolders.filter((f) => !f.parentId);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const slug = newFolderName.trim().toLowerCase().replace(/\s+/g, "_");
      const parentFolder = newFolderParentId
        ? localFolders.find((f) => f.id === newFolderParentId)
        : null;
      const path = parentFolder ? `${parentFolder.path}.${slug}` : slug;

      const created = await api.createFolder({
        name: newFolderName.trim(),
        path,
        parentId: newFolderParentId || undefined,
      });

      setLocalFolders((prev) => [...prev, created]);
      setSelectedFolderId(created.id);
      setShowNewFolder(false);
      setShowAllFolders(false);
      setNewFolderName("");
      setNewFolderParentId("");
    } catch {
      // silently skip
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-amber-500/25 bg-transparent dark:bg-amber-950/10">
      {/* Single compact row: icon | [path + change-folder link] | [Save as Scroll] [Skip] */}
      <div className="flex items-center gap-3 px-4 py-2">
        <span className="text-base flex-shrink-0">📜</span>

        {/* Left column: folder path + optional change-folder toggle */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 truncate">{folderLabel}</p>
          {localFolders.length > 0 && (
            <button
              onClick={() => { setShowAllFolders(!showAllFolders); setShowNewFolder(false); }}
              className="flex items-center gap-0.5 text-[10px] text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 transition-colors mt-0.5"
            >
              Change folder
              <ChevronDown
                className={cn("w-2.5 h-2.5 transition-transform", showAllFolders && "rotate-180")}
              />
            </button>
          )}
        </div>

        {/* Right: save button + skip */}
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-full px-4 flex-shrink-0"
        >
          {saving ? "Saving..." : "Save as Scroll"}
        </Button>
        <span
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer flex-shrink-0"
        >
          Skip
        </span>
      </div>

      {/* Folder picker — only rendered when open */}
      {showAllFolders && (
        <div className="border-t border-amber-500/15 px-4 pt-1.5 pb-2 space-y-0.5 max-h-44 overflow-y-auto">
          {localFolders.map((folder) => {
            const hasChildren = localFolders.some((f) => f.parentId === folder.id);
            const label = hasChildren
              ? formatPath(folder.path) + " → General"
              : formatPath(folder.path);
            const isActive =
              selectedFolderId === folder.id ||
              (!selectedFolderId && folder.id === suggestedFolder?.id);
            return (
              <button
                key={folder.id}
                onClick={() => {
                  setSelectedFolderId(folder.id);
                  setShowAllFolders(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-all",
                  isActive
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                    : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                )}
              >
                <span>{folder.icon ?? "📁"}</span>
                <span>{label}</span>
              </button>
            );
          })}

          {/* New folder */}
          {!showNewFolder ? (
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors border border-dashed border-gray-200 dark:border-slate-700 mt-1"
            >
              <Plus className="w-3 h-3" />
              New folder
            </button>
          ) : (
            <div className="mt-1 p-2 rounded-lg border border-amber-200 dark:border-amber-700/30 bg-amber-50 dark:bg-amber-900/10 space-y-2">
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setShowNewFolder(false);
                }}
                placeholder="Folder name..."
                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-400"
              />
              {parentFolders.length > 0 && (
                <select
                  value={newFolderParentId}
                  onChange={(e) => setNewFolderParentId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md px-2 py-1 text-xs text-gray-700 dark:text-slate-300 focus:outline-none focus:border-amber-400 appearance-none"
                >
                  <option value="">No parent (top level)</option>
                  {parentFolders.map((f) => (
                    <option key={f.id} value={f.id}>{f.icon ?? "📁"} {f.name}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-1.5">
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || creatingFolder}
                  className="flex-1 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium disabled:opacity-40 transition-colors"
                >
                  {creatingFolder ? "Creating..." : "Create"}
                </button>
                <button
                  onClick={() => { setShowNewFolder(false); setNewFolderName(""); setNewFolderParentId(""); }}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
