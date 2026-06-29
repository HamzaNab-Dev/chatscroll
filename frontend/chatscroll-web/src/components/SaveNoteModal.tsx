"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, X, Loader2 } from "lucide-react";
import type { Folder, FolderSuggestion } from "@/lib/api";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

// Sort a flat folder list so "General" subfolders appear first within each parent group
function sortFoldersForPicker(folders: Folder[]): Folder[] {
  return [...folders].sort((a, b) => {
    // Group by parent (folders with same parentId sort together via path)
    const aPath = a.path.split(".");
    const bPath = b.path.split(".");
    const aParentPath = aPath.slice(0, -1).join(".");
    const bParentPath = bPath.slice(0, -1).join(".");
    if (aParentPath !== bParentPath) return a.path.localeCompare(b.path);
    // Same parent: "general" last segment or name first
    const aG = aPath.at(-1) === "general" || a.name.toLowerCase() === "general";
    const bG = bPath.at(-1) === "general" || b.name.toLowerCase() === "general";
    if (aG && !bG) return -1;
    if (!aG && bG) return 1;
    return a.name.localeCompare(b.name);
  });
}

const FOLDER_ICONS = ["📁","💻","🔷","🏥","📚","🎓","🔬","💡","🎯","🚀","💼","🎮","🍕","🎵","📝","🌐","🔧","⚡","🧪","📊","🏋️","🌱","🎨","🐍","🦀","☁️"];

// Slugs that are too generic to be worth creating as child folders.
// When the only missing segment is one of these and a parent already exists,
// we save directly in the parent instead.
const GENERIC_SLUGS = new Set(["general", "misc", "other", "miscellaneous", "uncategorized", "default", "common"]);


interface SaveNoteModalProps {
  question: string;
  cleanNote: string;
  folderSuggestion: FolderSuggestion;
  folders: Folder[];
  foldersLoading?: boolean;
  onSave: (folderId: string, title: string) => Promise<void>;
}

function formatPath(path: string): string {
  return path
    .split(".")
    .map((p) => p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" → ");
}

// Walk from deepest segment to shallowest looking for a real folder match.
// Returns null when nothing matches — caller auto-creates from the suggestion.
function findBestFolder(folders: Folder[], suggestedPath: string): Folder | null {
  const segments = suggestedPath.split(".");
  for (let i = segments.length; i >= 1; i--) {
    const partial = segments.slice(0, i).join(".");
    const match = folders.find((f) => f.path === partial);
    if (match) return match;
  }
  return null;
}

export function SaveNoteModal({
  question,
  cleanNote: _cleanNote,
  folderSuggestion,
  folders,
  foldersLoading = false,
  onSave,
}: SaveNoteModalProps) {
  const [localFolders, setLocalFolders] = useState<Folder[]>(folders);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");
  // Open the picker immediately when there is no meaningful AI suggestion.
  const [showPicker, setShowPicker] = useState(() => {
    const p = folderSuggestion.suggestedPath;
    return !p || (p.split(".").length === 1 && GENERIC_SLUGS.has(p.toLowerCase()));
  });
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [newFolderParentId, setNewFolderParentId] = useState<string>("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalFolders(folders);
  }, [folders]);

  useEffect(() => {
    if (showPicker) {
      dropdownRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [showPicker]);

  const suggestedPath = folderSuggestion.suggestedPath ?? "";

  // Smart suggestion: exact path → parent segments → first leaf
  const suggestedFolder = findBestFolder(localFolders, suggestedPath);

  const activeFolder = selectedFolderId
    ? localFolders.find((f) => f.id === selectedFolderId)
    : suggestedFolder;

  // An exact match means the deepest existing folder covers the full suggested path.
  const hasExactMatch = !selectedFolderId && !!suggestedPath && suggestedFolder?.path === suggestedPath;

  // No meaningful suggestion: empty path, or the entire path is a single generic slug
  // (e.g. "general", "misc") with no existing folder to fall back to.
  const pathSegments = suggestedPath ? suggestedPath.split(".") : [];
  const isNoSuggestion =
    !selectedFolderId &&
    (!suggestedPath ||
      (pathSegments.length === 1 &&
        GENERIC_SLUGS.has(pathSegments[0].toLowerCase()) &&
        !suggestedFolder));

  // True when the only missing segment is a generic catch-all under an existing parent.
  // Save directly in the parent — no new child folder is created.
  const existingDepth = suggestedFolder ? suggestedFolder.path.split(".").length : 0;
  const pendingSegments = pathSegments.slice(existingDepth);
  const isGenericChildOnly =
    !selectedFolderId &&
    !isNoSuggestion &&
    !!suggestedFolder &&
    pendingSegments.length === 1 &&
    GENERIC_SLUGS.has(pendingSegments[0].toLowerCase());

  const willCreateFolder = !selectedFolderId && !hasExactMatch && !isGenericChildOnly && !isNoSuggestion;

  // Label display
  const folderLabel = (() => {
    if (selectedFolderId && activeFolder) return formatPath(activeFolder.path);
    if (hasExactMatch && activeFolder) return formatPath(activeFolder.path);
    if (isGenericChildOnly && suggestedFolder) return formatPath(suggestedFolder.path);
    if (isNoSuggestion) return null; // rendered separately as placeholder
    return formatPath(suggestedPath);
  })();

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      let folderId = selectedFolderId;

      if (!folderId) {
        if (hasExactMatch && suggestedFolder) {
          // Full path already exists — use it directly.
          folderId = suggestedFolder.id;
        } else {
          // If there is no meaningful suggestion, require the user to pick a folder
          // rather than auto-creating a generic one.
          if (isNoSuggestion) {
            if (localFolders.length > 0) {
              setSaveError("Please select a folder from the list.");
              setShowPicker(true);
              return;
            }
            // No folders exist at all — create a neutral starter folder.
            const created = await api.createFolder({ name: "Notes", path: "notes", icon: "📝" });
            setLocalFolders((prev) => [...prev, created].sort((a, b) => a.path.localeCompare(b.path)));
            folderId = created.id;
          } else {
          const allSegments = suggestedPath.split(".");
          const existingDepth = suggestedFolder ? suggestedFolder.path.split(".").length : 0;
          const segmentsToCreate = allSegments.slice(existingDepth);

          let parent: { id: string; path: string } | null = suggestedFolder
            ? { id: suggestedFolder.id, path: suggestedFolder.path }
            : null;

          for (let i = 0; i < segmentsToCreate.length; i++) {
            const seg = segmentsToCreate[i];
            const slug = seg.toLowerCase().replace(/[^a-z0-9_]/g, "_");
            if (!slug) continue;
            // Never auto-create generic catch-all folders; save in the last real parent instead.
            if (GENERIC_SLUGS.has(slug)) break;
            const name = slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const path = parent ? `${parent.path}.${slug}` : slug;

            const created = await api.createFolder({
              name,
              path,
              icon: "📁",
              parentId: parent?.id,
            });
            setLocalFolders((prev) => [...prev, created].sort((a, b) => a.path.localeCompare(b.path)));
            parent = { id: created.id, path: created.path };
          }

          folderId = parent?.id ?? "";
          } // end else (not isNoSuggestion)
        }
      }

      const title = question.length > 60 ? question.slice(0, 60) + "..." : question;
      await onSave(folderId, title);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setSaveError(msg);
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
      setLocalFolders((prev) => [...prev, created].sort((a, b) => a.path.localeCompare(b.path)));
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
    <div className="relative rounded-xl border border-amber-500/20 bg-amber-50/40 dark:bg-amber-950/10">
      {/* Compact single row — all children are flex-shrink-0 except the picker button */}
      <div className="flex items-center gap-2 px-3 py-1.5 w-full">
        <span className="text-sm flex-shrink-0">{activeFolder?.icon ?? "📁"}</span>

        {foldersLoading && localFolders.length === 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500 flex-1 min-w-0">
            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />
            <span>Loading folders…</span>
          </div>
        ) : (
          /* Picker button takes all remaining width; text truncates inside it */
          <button
            onClick={() => { setShowPicker((v) => !v); setShowNewFolder(false); }}
            className="flex items-center gap-1 group flex-1 min-w-0"
          >
            {isNoSuggestion ? (
              <span className="text-xs text-gray-400 dark:text-slate-500 truncate min-w-0 flex-1 text-left italic group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                Select a folder…
              </span>
            ) : (
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate min-w-0 flex-1 text-left group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                {folderLabel}
              </span>
            )}
            <ChevronDown
              className={cn(
                "w-3 h-3 flex-shrink-0 text-amber-500 dark:text-amber-500 transition-transform",
                showPicker && "rotate-180"
              )}
            />
          </button>
        )}

        {/* Badge lives outside the picker button so it never competes with the text */}
        {willCreateFolder && (
          <span className="text-[9px] font-bold bg-emerald-500 text-white rounded-full px-1.5 py-px leading-none flex-shrink-0">
            New
          </span>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-shrink-0 h-6 px-3 text-[11px] font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-full disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Inline save error */}
      {saveError && (
        <div className="px-3 pb-1.5">
          <p className="text-[10px] text-red-500 dark:text-red-400">{saveError}</p>
        </div>
      )}

      {/* Folder picker */}
      {showPicker && (
        <div ref={dropdownRef} className={cn("absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-amber-200/60 dark:border-amber-700/20 bg-white dark:bg-slate-900 shadow-lg px-3 pt-1 pb-2 space-y-0.5 overflow-y-auto", showNewFolder ? "max-h-96" : "max-h-[250px]")}>
          {/* New folder — always at the top */}
          {!showNewFolder ? (
            <button
              onClick={() => setShowNewFolder(true)}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-gray-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-slate-800/60 transition-colors border border-dashed border-gray-200 dark:border-slate-700 mb-0.5"
            >
              <Plus className="w-3 h-3 flex-shrink-0" />
              New folder
            </button>
          ) : (
            <div className="mb-0.5 p-2 rounded-lg border border-amber-200 dark:border-amber-700/30 bg-white dark:bg-slate-800/60 space-y-1.5">
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

          {sortFoldersForPicker(localFolders).map((folder) => {
            const label = formatPath(folder.path);
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

        </div>
      )}
    </div>
  );
}
