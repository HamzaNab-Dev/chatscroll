"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import type { Folder, FolderSuggestion } from "@/lib/api";
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
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [showAllFolders, setShowAllFolders] = useState(false);

  const suggestedFolder = folders.find(
    (f) => f.path === folderSuggestion.suggestedPath
  );

  const activeFolder = selectedFolderId
    ? folders.find((f) => f.id === selectedFolderId)
    : suggestedFolder;

  const folderLabel = activeFolder
    ? formatPath(activeFolder.path)
    : formatPath(folderSuggestion.suggestedPath);

  const handleSave = async () => {
    const folderId = selectedFolderId || suggestedFolder?.id || folders[0]?.id;
    if (!folderId) return;
    setSaving(true);
    try {
      const title = question.length > 60 ? question.slice(0, 60) + "..." : question;
      await onSave(folderId, title);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl border border-amber-500/20 bg-transparent dark:bg-amber-950/10">
      {/* Single compact row */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 max-h-[52px]">
        <span className="text-sm flex-shrink-0">📜</span>
        <span className="flex-1 text-xs font-medium text-amber-600 dark:text-amber-400 truncate">
          {folderLabel}
        </span>
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

      {/* Change folder dropdown */}
      {folders.length > 1 && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setShowAllFolders(!showAllFolders)}
            className="flex items-center gap-0.5 text-[10px] text-amber-600/50 dark:text-amber-500/50 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Change folder
            <ChevronDown
              className={cn("w-3 h-3 transition-transform", showAllFolders && "rotate-180")}
            />
          </button>

          {showAllFolders && (
            <div className="mt-1.5 space-y-0.5 max-h-32 overflow-y-auto">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setShowAllFolders(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-all",
                    selectedFolderId === folder.id ||
                      (!selectedFolderId && folder.id === suggestedFolder?.id)
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                      : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  <span>{folder.icon ?? "📁"}</span>
                  <span>{formatPath(folder.path)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
