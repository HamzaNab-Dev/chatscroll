"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Folder } from "@/lib/api";

function ChatContent() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);

  // Pick up a pending question stored by the landing page before redirecting to login
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingQuestion");
    if (pending) {
      sessionStorage.removeItem("pendingQuestion");
      setInitialMessage(pending);
    }
  }, []);

  const loadFolders = useCallback(async () => {
    try {
      const data = await api.getFolders();
      setFolders(data);
    } catch {
      console.error("Failed to load folders");
    }
  }, []);

  useEffect(() => {
    loadFolders();
  }, [loadFolders, refreshKey]);

  const handleNoteSaved = (folderId: string) => {
    // Optimistically increment the saved folder's noteCount for instant visual feedback
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, noteCount: f.noteCount + 1 } : f))
    );
    // Trigger full refresh to sync with backend (re-fetches folders + notes)
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden">
      <Navigation />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-slate-800">
          <ChatPanel folders={folders} onNoteSaved={handleNoteSaved} initialMessage={initialMessage} />
        </main>
        <aside className="w-80 flex-shrink-0 hidden lg:flex flex-col">
          <KnowledgePanel folders={folders} refreshKey={refreshKey} />
        </aside>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
