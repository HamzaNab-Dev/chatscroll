"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import type { Folder, FolderSuggestion } from "@/lib/api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const FOLDER_ICONS = ["📁","💻","🔷","🏥","📚","🎓","🔬","💡","🎯","🚀","💼","🎮","🍕","🎵","📝","🌐","🔧","⚡","🧪","📊","🏋️","🌱","🎨","🐍","🦀","☁️"];


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
    .map((p) => p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" → ");
}

// Walk from deepest segment to shallowest looking for a real folder match.
// Falls back to the first leaf folder, then to folders[0].
function findBestFolder(folders: Folder[], suggestedPath: string): Folder | null {
  const segments = suggestedPath.split(".");
  for (let i = segments.length; i >= 1; i--) {
    const partial = segments.slice(0, i).join(".");
    const match = folders.find((f) => f.path === partial);
    if (match) return match;
  }
  // Prefer a leaf folder (no children) so the label doesn't gain "→ General"
  const leaf = folders.find((f) => !folders.some((c) => c.parentId === f.id));
  return leaf ?? folders[0] ?? null;
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
  const [showPicker, setShowPicker] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [newFolderParentId, setNewFolderParentId] = useState<string>("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  useEffect(() => {
    setLocalFolders(folders);
  }, [folders]);

  // Smart suggestion: exact path → parent segments → first leaf
  const suggestedFolder = findBestFolder(localFolders, folderSuggestion.suggestedPath);

  const activeFolder = selectedFolderId
    ? localFolders.find((f) => f.id === selectedFolderId)
    : suggestedFolder;

  const activeFolderHasChildren = localFolders.some((f) => f.parentId === activeFolder?.id);

  const folderLabel = activeFolder
    ? activeFolderHasChildren
      ? formatPath(activeFolder.path) + " → General"
      : formatPath(activeFolder.path)
    : formatPath(folderSuggestion.suggestedPath);

  const handleSave = async () => {
    let folderId = selectedFolderId || suggestedFolder?.id || localFolders[0]?.id;
    setSaving(true);
    try {
      if (!folderId) {
        // No folders yet — auto-create one from the AI's suggestion
        const topSegment = folderSuggestion.suggestedPath.split(".")[0];
        const slug = topSegment.toLowerCase().replace(/[^a-z0-9_]/g, "_") || "general";
        const name = folderSuggestion.suggestedName || slug.replace(/_/g, " ");
        const created = await api.createFolder({ name, path: slug, icon: "📁" });
        setLocalFolders((prev) => [...prev, created]);
        folderId = created.id;
      }
      const title = question.length > 60 ? question.slice(0, 60) + "..." : question;
      await onSave(folderId, title);
    } catch (err) {
      console.error("Failed to save scroll:", err);
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
        icon: newFolderIcon,
        parentId: newFolderParentId || undefined,
      });
      setLocalFolders((prev) => [...prev, created]);
      setSelectedFolderId(created.id);
      setShowNewFolder(false);
      setShowPicker(false);
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
    <div className="rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/10">
      {/* Compact single row */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-sm flex-shrink-0">📜</span>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => { setShowPicker((v) => !v); setShowNewFolder(false); }}
            className="flex items-center gap-1 group min-w-0"
          >
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
              {folderLabel}
            </span>
            <ChevronDown
              className={cn(
                "w-3 h-3 flex-shrink-0 text-amber-500 dark:text-amber-500 transition-transform",
                showPicker && "rotate-180"
              )}
            />
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-shrink-0 h-6 px-3 text-[11px] font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-full disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-[11px] text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Folder picker */}
      {showPicker && (
        <div className={cn("border-t border-amber-200/60 dark:border-amber-700/20 px-3 pt-1 pb-2 space-y-0.5 overflow-y-auto", showNewFolder ? "max-h-96" : "max-h-48")}>
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
                onClick={() => { setSelectedFolderId(folder.id); setShowPicker(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-all",
                  isActive
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium"
                    : "text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800/60"
                )}
              >
                <span className="flex-shrink-0">{folder.icon ?? "📁"}</span>
                <span className="truncate">{label}</span>
              </button>
            );
          })}

          {/* New folder toggle */}
          {!showNewFolder ? (
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800/60 transition-colors border border-dashed border-gray-200 dark:border-slate-700 mt-0.5"
            >
              <Plus className="w-3 h-3 flex-shrink-0" />
              New folder
            </button>
          ) : (
            <div className="mt-1 p-2 rounded-lg border border-amber-200 dark:border-amber-700/30 bg-white dark:bg-slate-800/60 space-y-1.5">
              <div className="flex gap-1.5">
                <span className="text-lg leading-none pt-0.5">{newFolderIcon}</span>
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") setShowNewFolder(false);
                  }}
                  placeholder="Folder name..."
                  className="flex-1 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1 text-xs text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              {parentFolders.length > 0 && (
                <select
                  value={newFolderParentId}
                  onChange={(e) => setNewFolderParentId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1 text-xs text-gray-700 dark:text-slate-300 focus:outline-none focus:border-amber-400 appearance-none"
                >
                  <option value="">Top level (no parent)</option>
                  {parentFolders.map((f) => (
                    <option key={f.id} value={f.id}>{f.icon ?? "📁"} {f.name}</option>
                  ))}
                </select>
              )}
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
              <div className="flex gap-1">
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || creatingFolder}
                  className="flex-1 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-medium disabled:opacity-40 transition-colors"
                >
                  {creatingFolder ? "Creating…" : "Create"}
                </button>
                <button
                  onClick={() => { setShowNewFolder(false); setNewFolderName(""); setNewFolderIcon("📁"); setNewFolderParentId(""); }}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
