"use client";

import { PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: Date;
};

interface ConversationsSidebarProps {
  conversations: ConversationItem[];
  currentId: string | undefined;
  onNew: () => void;
  onSelect: (id: string) => void;
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

export function ConversationsSidebar({
  conversations,
  currentId,
  onNew,
  onSelect,
}: ConversationsSidebarProps) {
  const groups = groupByDate(conversations);

  return (
    <aside className="w-56 flex-shrink-0 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full hidden md:flex">
      {/* New Chat button */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-800">
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
        {groups.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-slate-600 text-center py-8 px-3">
            No conversations yet
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-600">
                {group.label}
              </p>
              {group.items.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs transition-colors truncate",
                    currentId === conv.id
                      ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium"
                      : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                  )}
                  title={conv.title || "New Chat"}
                >
                  {conv.title || "New Chat"}
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
