"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { Folder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { buildFolderTree } from "@/lib/utils";

interface FolderTreeProps {
  folders: Folder[];
  onFolderSelect: (folder: Folder) => void;
  selectedFolderId?: string;
}

function FolderNode({
  folder,
  depth,
  onSelect,
  selectedId,
}: {
  folder: Folder;
  depth: number;
  onSelect: (f: Folder) => void;
  selectedId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const isSelected = folder.id === selectedId;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-lg transition-all",
          "hover:bg-gray-100 dark:hover:bg-slate-800/60",
          isSelected && "bg-gray-100 dark:bg-slate-800"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {/* Arrow — toggles expand/collapse only */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className="w-5 flex-shrink-0 flex items-center justify-center text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : null}
        </button>

        {/* Folder name — selects, and expands if has children */}
        <button
          onClick={() => {
            onSelect(folder);
            if (hasChildren && !expanded) setExpanded(true);
          }}
          className="flex-1 flex items-center gap-1.5 py-2 pr-2 text-left min-w-0"
        >
          <span className="text-base flex-shrink-0">
            {folder.icon ?? (isSelected ? "📂" : "📁")}
          </span>

          <span
            className={cn(
              "text-sm flex-1 truncate",
              isSelected
                ? "text-amber-700 dark:text-amber-200 font-medium"
                : "text-gray-700 dark:text-slate-300"
            )}
          >
            {folder.name}
          </span>

          {folder.noteCount > 0 && (
            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/40 rounded-full px-1.5 flex-shrink-0">
              {folder.noteCount}
            </span>
          )}
        </button>
      </div>

      {hasChildren && expanded && (
        <div>
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  folders,
  onFolderSelect,
  selectedFolderId,
}: FolderTreeProps) {
  const tree = buildFolderTree(folders);

  return (
    <div className="space-y-0.5">
      {tree.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          depth={0}
          onSelect={onFolderSelect}
          selectedId={selectedFolderId}
        />
      ))}
    </div>
  );
}
