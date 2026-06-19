"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { Navigation } from "@/components/Navigation";
import { ConversationsSidebar, type ConversationItem } from "@/components/ConversationsSidebar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { generateId } from "@/lib/utils";
import type { Folder } from "@/lib/api";

const STORAGE_KEY = "chatscroll_conversations";

function loadConversations(): ConversationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as ConversationItem[]).map((c) => ({
      ...c,
      updatedAt: new Date(c.updatedAt),
    }));
  } catch {
    return [];
  }
}

function saveConversations(convs: ConversationItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
}

function ChatContent() {
  const { isAuthenticated } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string>(() => generateId());
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  // Load pending question + existing conversations on mount
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingQuestion");
    if (pending) {
      sessionStorage.removeItem("pendingQuestion");
      setInitialMessage(pending);
    }
    setConversations(loadConversations());
  }, []);

  const loadFolders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getFolders();
      setFolders(data);
    } catch {
      // silently skip
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFolders();
  }, [loadFolders, refreshKey]);

  const handleNoteSaved = (folderId: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, noteCount: f.noteCount + 1 } : f))
    );
    setRefreshKey((k) => k + 1);
  };

  const handleNewChat = () => {
    const newId = generateId();
    setConversationId(newId);
    setInitialMessage(undefined);
  };

  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    setInitialMessage(undefined);
  };

  const handleFirstMessage = useCallback((msg: string, convId: string) => {
    const title = msg.length > 45 ? msg.slice(0, 45) + "..." : msg;
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === convId);
      let updated: ConversationItem[];
      if (existing) {
        updated = prev.map((c) =>
          c.id === convId ? { ...c, title, updatedAt: new Date() } : c
        );
      } else {
        updated = [{ id: convId, title, updatedAt: new Date() }, ...prev];
      }
      saveConversations(updated);
      return updated;
    });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden">
      <Navigation />
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations sidebar */}
        <ConversationsSidebar
          conversations={conversations}
          currentId={conversationId}
          onNew={handleNewChat}
          onSelect={handleSelectConversation}
        />

        {/* Chat area */}
        <main className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-slate-800">
          <ChatPanel
            key={conversationId}
            folders={folders}
            onNoteSaved={handleNoteSaved}
            initialMessage={initialMessage}
            conversationId={conversationId}
            onFirstMessage={handleFirstMessage}
          />
        </main>

        {/* Knowledge panel */}
        <aside className="w-72 flex-shrink-0 hidden lg:flex flex-col">
          <KnowledgePanel folders={folders} refreshKey={refreshKey} />
        </aside>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <ChatContent />;
}
