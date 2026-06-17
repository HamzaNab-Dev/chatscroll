"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderOpen, Sparkles, Check } from "lucide-react";
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
    ? `${activeFolder.icon ?? "📁"} ${activeFolder.name}`
    : folderSuggestion.suggestedPath
        .split(".")
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" → ");

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
    <div className="mt-2 rounded-lg border border-gray-200 dark:border-slate-700/50 bg-white/60 dark:bg-transparent">
      {/* Single-row main layout */}
      <div className="flex items-center gap-2.5 px-3 py-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
        <span className="flex-1 text-xs font-medium text-gray-700 dark:text-slate-300 truncate">
          {folderLabel}
        </span>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="h-7 text-xs bg-amber-600 hover:bg-amber-500 text-white rounded-full px-4 flex-shrink-0"
        >
          {saving ? (
            "Saving..."
          ) : (
            <>
              <Check className="w-3 h-3 mr-1" />
              Save Note
            </>
          )}
        </Button>
        <button
          onClick={onDismiss}
          className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
        >
          Skip
        </button>
      </div>

      {/* Change folder — tiny toggle, hidden below */}
      {folders.length > 1 && (
        <div className="px-3 pb-2 -mt-0.5">
          <button
            onClick={() => setShowAllFolders(!showAllFolders)}
            className="text-[10px] text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 flex items-center gap-1 transition-colors"
          >
            <FolderOpen className="w-3 h-3" />
            {showAllFolders ? "Hide" : "Change folder"}
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
                  <span>{folder.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
