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
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const isSelected = folder.id === selectedId;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(folder);
          if (hasChildren) setExpanded(!expanded);
        }}
        className={cn(
          "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-all",
          "hover:bg-slate-800/60",
          isSelected && "bg-slate-800 text-amber-300"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        <span className="w-4 flex-shrink-0 text-slate-600">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : null}
        </span>

        <span className="text-base flex-shrink-0">
          {folder.icon ?? (isSelected ? "📂" : "📁")}
        </span>

        <span
          className={cn(
            "text-sm flex-1 truncate",
            isSelected ? "text-amber-200 font-medium" : "text-slate-300"
          )}
        >
          {folder.name}
        </span>

        {folder.noteCount > 0 && (
          <span className="text-xs text-slate-600 flex-shrink-0">
            {folder.noteCount}
          </span>
        )}
      </button>

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
