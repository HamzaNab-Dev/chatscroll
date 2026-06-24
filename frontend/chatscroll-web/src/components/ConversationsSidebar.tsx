"use client";

import { useState, useRef, useEffect } from "react";
import { PenSquare, Pin, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: Date;
};

interface ConversationsSidebarProps {
  conversations: ConversationItem[];
  currentId: string | undefined;
  pinnedIds: Set<string>;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string) => void;
  loading?: boolean;
}

function groupByDate(conversations: ConversationItem[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: { label: string; items: ConversationItem[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Older", items: [] },
  ];

  for (const conv of conversations) {
    const d = new Date(conv.updatedAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (day >= today) groups[0].items.push(conv);
    else if (day >= yesterday) groups[1].items.push(conv);
    else if (d >= weekAgo) groups[2].items.push(conv);
    else groups[3].items.push(conv);
  }

  return groups.filter((g) => g.items.length > 0);
}

interface ConvRowProps {
  conv: ConversationItem;
  isActive: boolean;
  isPinned: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPin: () => void;
  onRenameConfirm: (title: string) => void;
}

function ConvRow({ conv, isActive, isPinned, onSelect, onDelete, onPin, onRenameConfirm }: ConvRowProps) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editValue, setEditValue] = useState(conv.title || "New Chat");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setEditValue(conv.title || "New Chat");
      // Select all on next tick so the browser has rendered the input
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
    }
  }, [editing, conv.title]);

  const finish = () => {
    const t = editValue.trim();
    if (t && t !== (conv.title || "New Chat")) onRenameConfirm(t);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="px-2 py-1">
        <input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); finish(); }
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={finish}
          className="w-full text-xs bg-white dark:bg-slate-800 border border-amber-400 dark:border-amber-500/60 rounded px-2 py-1 text-gray-800 dark:text-slate-200 focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors cursor-pointer",
        isActive
          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
          : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
      )}
    >
      {isPinned && (
        <Pin className="w-2.5 h-2.5 flex-shrink-0 text-amber-500 dark:text-amber-400 rotate-45 opacity-70" />
      )}

      <button
        onClick={onSelect}
        className={cn("flex-1 text-left text-xs truncate min-w-0", isActive && "font-medium")}
        title={conv.title || "New Chat"}
      >
        {conv.title || "New Chat"}
      </button>

      {/* Delete confirmation — shown when trash is clicked */}
      {confirmingDelete && (
        <div
          className="flex items-center gap-1 flex-shrink-0 ml-1"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-red-500 dark:text-red-400 whitespace-nowrap font-medium">Delete?</span>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false); onDelete(); }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
          >
            Yes
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmingDelete(false); }}
            className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-300 font-medium transition-colors"
          >
            No
          </button>
        </div>
      )}

      {/* Hover-reveal action buttons — hidden while confirming delete */}
      {!confirmingDelete && (
        <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0 ml-1">
          <button
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            title={isPinned ? "Unpin" : "Pin to top"}
            className={cn(
              "p-1 rounded transition-colors",
              isPinned
                ? "text-amber-500 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                : "text-gray-400 dark:text-slate-500 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-700"
            )}
          >
            <Pin className="w-2.5 h-2.5 rotate-45" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setEditing(true); }}
            title="Rename"
            className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmingDelete(true); }}
            title="Delete"
            className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function ConversationsSidebar({
  conversations,
  currentId,
  pinnedIds,
  onNew,
  onSelect,
  onDelete,
  onRename,
  onPin,
  loading = false,
}: ConversationsSidebarProps) {
  const pinned = conversations.filter((c) => pinnedIds.has(c.id));
  const unpinned = conversations.filter((c) => !pinnedIds.has(c.id));
  const dateGroups = groupByDate(unpinned);
  const isEmpty = conversations.length === 0;

  const renderConv = (conv: ConversationItem) => (
    <ConvRow
      key={conv.id}
      conv={conv}
      isActive={currentId === conv.id}
      isPinned={pinnedIds.has(conv.id)}
      onSelect={() => onSelect(conv.id)}
      onDelete={() => onDelete(conv.id)}
      onPin={() => onPin(conv.id)}
      onRenameConfirm={(title) => onRename(conv.id, title)}
    />
  );

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full">
      {/* New Chat button */}
      <div className="px-3 py-1 border-b border-gray-200 dark:border-slate-800">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-medium"
        >
          <PenSquare className="w-3.5 h-3.5" />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="space-y-1 px-3 py-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-7 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-8 px-3">
            No conversations yet
          </p>
        ) : (
          <>
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div className="mb-2">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-600 flex items-center gap-1">
                  <Pin className="w-2.5 h-2.5 rotate-45" /> Pinned
                </p>
                <div className="px-1">{pinned.map(renderConv)}</div>
              </div>
            )}

            {/* Date-grouped sections */}
            {dateGroups.map((group) => (
              <div key={group.label} className="mb-2">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-600">
                  {group.label}
                </p>
                <div className="px-1">{group.items.map(renderConv)}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
