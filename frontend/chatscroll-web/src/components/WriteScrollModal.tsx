"use client";

import { useState, useEffect } from "react";
import { X, ChevronDown, Plus } from "lucide-react";
import { api } from "@/lib/api";
import type { Folder, Note } from "@/lib/api";
import { cn } from "@/lib/utils";

const FOLDER_ICONS = ["📁","💻","🔷","🏥","📚","🎓","🔬","💡","🎯","🚀","💼","🎮","🍕","🎵","📝","🌐","🔧","⚡","🧪","📊","🏋️","🌱","🎨","🐍","🦀","☁️"];

function formatPath(path: string): string {
  return path
    .split(".")
    .map((p) => p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" → ");
}

interface WriteScrollModalProps {
  folders: Folder[];
  defaultFolderId?: string;
  onSaved: (note: Note) => void;
  onClose: () => void;
}

export function WriteScrollModal({ folders, defaultFolderId, onSaved, onClose }: WriteScrollModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [localFolders, setLocalFolders] = useState<Folder[]>(folders);
  const [selectedFolderId, setSelectedFolderId] = useState(defaultFolderId ?? "");
  const [showPicker, setShowPicker] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderIcon, setNewFolderIcon] = useState("📁");
  const [newFolderParentId, setNewFolderParentId] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setLocalFolders(folders); }, [folders]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const activeFolder = localFolders.find((f) => f.id === selectedFolderId);
  const folderLabel = activeFolder ? formatPath(activeFolder.path) : "Choose a folder…";
  const parentFolders = localFolders.filter((f) => !f.parentId);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      const slug = newFolderName.trim().toLowerCase().replace(/\s+/g, "_");
      const parentFolder = newFolderParentId ? localFolders.find((f) => f.id === newFolderParentId) : null;
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

  const handleSave = async () => {
    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!body.trim()) { setError("Please write something in the body."); return; }
    if (!selectedFolderId) { setError("Please choose a folder to save into."); return; }

    setSaving(true);
    setError("");
    try {
      const created = await api.createNote({
        folderId: selectedFolderId,
        title: title.trim(),
        originalQuestion: title.trim(),
        originalAnswer: body.trim(),
        cleanContent: body.trim(),
        tags: [],
      });
      onSaved(created);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">📜</span>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Write a Scroll</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Title */}
          <input
            autoFocus
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
            placeholder="What's this scroll about?"
            className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50 transition-colors"
          />

          {/* Body */}
          <textarea
            value={body}
            onChange={(e) => { setBody(e.target.value); setError(""); }}
            placeholder="Write your knowledge here… from a book, article, or your own expertise"
            rows={8}
            className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50 transition-colors resize-none leading-relaxed"
          />

          {/* Folder picker */}
          <div className="rounded-xl border border-amber-200/60 dark:border-amber-700/20 bg-amber-50/40 dark:bg-amber-950/10">
            <button
              onClick={() => { setShowPicker((v) => !v); setShowNewFolder(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 group"
            >
              <span className="text-sm flex-shrink-0">📁</span>
              <span className="flex-1 text-left text-xs font-medium text-amber-700 dark:text-amber-400 truncate group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors">
                {folderLabel}
              </span>
              <ChevronDown className={cn("w-3.5 h-3.5 flex-shrink-0 text-amber-500 transition-transform", showPicker && "rotate-180")} />
            </button>

            {showPicker && (
              <div className={cn("border-t border-amber-200/60 dark:border-amber-700/20 px-3 pt-1 pb-2 space-y-0.5 overflow-y-auto", showNewFolder ? "max-h-72" : "max-h-48")}>
                {/* New folder toggle */}
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

                {localFolders.length === 0 && !showNewFolder && (
                  <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-3">
                    No folders yet — create one above
                  </p>
                )}

                {localFolders.map((folder) => {
                  const label = formatPath(folder.path);
                  const isActive = selectedFolderId === folder.id;
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

          {error && (
            <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim() || !body.trim() || !selectedFolderId}
            className="px-5 py-2 rounded-xl text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-40 transition-colors"
          >
            {saving ? "Saving…" : "Save Scroll"}
          </button>
        </div>
      </div>
    </div>
  );
}
