"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderOpen, Sparkles, Check, X } from "lucide-react";
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
    <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-300">
            Save to your knowledge tree?
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {suggestedFolder && (
        <div className="space-y-1">
          <p className="text-xs text-slate-500">AI suggests:</p>
          <button
            onClick={() => setSelectedFolderId(suggestedFolder.id)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all",
              selectedFolderId === suggestedFolder.id || !selectedFolderId
                ? "border-amber-500/50 bg-amber-900/30 text-amber-200"
                : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500"
            )}
          >
            <span className="text-lg">{suggestedFolder.icon ?? "📁"}</span>
            <div className="flex-1">
              <div className="text-sm font-medium">{suggestedFolder.name}</div>
              <div className="text-xs text-slate-500">{suggestedFolder.path}</div>
            </div>
            {(!selectedFolderId || selectedFolderId === suggestedFolder.id) && (
              <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-400">
                Suggested
              </Badge>
            )}
          </button>
          <p className="text-xs text-slate-600 pl-1">{folderSuggestion.reasoning}</p>
        </div>
      )}

      {folders.length > 1 && (
        <div className="space-y-1">
          <button
            onClick={() => setShowAllFolders(!showAllFolders)}
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            <FolderOpen className="w-3 h-3" />
            {showAllFolders ? "Hide" : "Choose different folder"}
          </button>

          {showAllFolders && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {folders
                .filter((f) => f.id !== suggestedFolder?.id)
                .map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all text-sm",
                      selectedFolderId === folder.id
                        ? "border-amber-500/50 bg-amber-900/30 text-amber-200"
                        : "border-slate-700 bg-slate-800/30 text-slate-400 hover:border-slate-600 hover:text-slate-300"
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

      <div className="flex gap-2 pt-1">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="sm"
          className="bg-amber-600 hover:bg-amber-500 text-white flex-1"
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
        <Button
          onClick={onDismiss}
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-slate-200"
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
