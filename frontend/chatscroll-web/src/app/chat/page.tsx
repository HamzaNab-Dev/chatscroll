"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatPanel } from "@/components/ChatPanel";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { Navigation } from "@/components/Navigation";
import { ConversationsSidebar, type ConversationItem } from "@/components/ConversationsSidebar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Folder } from "@/lib/api";
import { Menu, ScrollText } from "lucide-react";

const LAST_CONV_KEY = "cs_last_conv";
const CONV_CACHE_KEY = "cs_convs";

function ChatContent() {
  const { isAuthenticated } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Mobile panel visibility
  const [showConversations, setShowConversations] = useState(false);
  const [showScrolls, setShowScrolls] = useState(false);

  // Load pending question on mount, then load conversation list from real API
  useEffect(() => {
    const pending = sessionStorage.getItem("pendingQuestion");
    if (pending) {
      sessionStorage.removeItem("pendingQuestion");
      setInitialMessage(pending);
    }

    const initConversations = async () => {
      const lastId = (() => { try { return localStorage.getItem(LAST_CONV_KEY); } catch { return null; } })();

      try {
        const convs = await api.getConversations();
        const mapped: ConversationItem[] = convs.map((c) => ({
          id: c.id,
          title: c.title || "New Chat",
          updatedAt: new Date(c.updatedAt),
        }));
        setConversations(mapped);

        if (mapped.length > 0 && !pending) {
          // Resume the exact conversation the user was on before the refresh
          const resume = lastId ? mapped.find((c) => c.id === lastId) : null;
          setConversationId(resume ? resume.id : mapped[0].id);
        } else {
          // No conversations yet, or a pending question needs a fresh chat — create one
          const newConv = await api.createConversation();
          const newItem: ConversationItem = { id: newConv.id, title: "New Chat", updatedAt: new Date(newConv.updatedAt) };
          setConversationId(newConv.id);
          // Prepend — never replace existing conversations
          setConversations((prev) => [newItem, ...prev]);
        }
      } catch (err) {
        console.warn("Failed to load conversations from API, restoring from cache:", err);
        // Restore from localStorage cache so the user doesn't see "No conversations yet"
        try {
          const cached = localStorage.getItem(CONV_CACHE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached) as Array<{ id: string; title: string; updatedAt: string }>;
            const restored = parsed.map((c) => ({ ...c, updatedAt: new Date(c.updatedAt) }));
            setConversations(restored);
            const target = lastId ? restored.find((c) => c.id === lastId) : null;
            const fallback = target ?? restored[0];
            if (fallback) setConversationId(fallback.id);
          }
        } catch {}
      } finally {
        setLoadingConversations(false);
      }
    };

    initConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the active conversation so we can restore it on next page load
  useEffect(() => {
    if (conversationId) {
      try { localStorage.setItem(LAST_CONV_KEY, conversationId); } catch {}
    }
  }, [conversationId]);

  // Cache the conversation list so it can be shown if the API call fails on next load
  useEffect(() => {
    if (conversations.length > 0) {
      try { localStorage.setItem(CONV_CACHE_KEY, JSON.stringify(conversations)); } catch {}
    }
  }, [conversations]);

  const loadFolders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getFolders();
      setFolders(data);
    } catch (err) {
      console.error("Failed to load folders:", err);
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

  const handleNewChat = async () => {
    try {
      const newConv = await api.createConversation();
      const item: ConversationItem = {
        id: newConv.id,
        title: "New Chat",
        updatedAt: new Date(newConv.updatedAt),
      };
      setConversationId(newConv.id);
      setConversations((prev) => [item, ...prev]);
    } catch (err) {
      console.warn("Failed to create conversation in Aurora, using local ID:", err);
      setConversationId(crypto.randomUUID());
    }
    setInitialMessage(undefined);
    setShowConversations(false); // Close mobile panel after selection
  };

  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    setInitialMessage(undefined);
    setShowConversations(false); // Close mobile panel after selection
  };

  // Called by ChatPanel when the first user message is sent
  const handleFirstMessage = useCallback((msg: string, convId: string) => {
    const title = msg.length > 45 ? msg.slice(0, 45) + "..." : msg;

    // Update sidebar immediately (optimistic)
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === convId);
      if (existing) {
        return prev.map((c) =>
          c.id === convId ? { ...c, title, updatedAt: new Date() } : c
        );
      }
      return [{ id: convId, title, updatedAt: new Date() }, ...prev];
    });

    // Persist title to Aurora (ChatController already does this server-side via the message endpoint,
    // but we also call PATCH here as a belt-and-suspenders for newly-created conversations)
    api.updateConversationTitle(convId, title).catch((err) =>
      console.warn("Failed to update conversation title:", err)
    );
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 overflow-hidden">
      <Navigation />

      {/* Mobile top bar: conversation toggle + scrolls toggle */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-200 dark:border-slate-800 md:hidden">
        <button
          onClick={() => { setShowConversations((v) => !v); setShowScrolls(false); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showConversations
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-600/40"
              : "text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
          }`}
          aria-label="Toggle conversations panel"
        >
          <Menu className="w-3.5 h-3.5" />
          History
        </button>
        <button
          onClick={() => { setShowScrolls((v) => !v); setShowConversations(false); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showScrolls
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-600/40"
              : "text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800"
          }`}
          aria-label="Toggle scrolls panel"
        >
          <ScrollText className="w-3.5 h-3.5" />
          Scrolls
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Conversations sidebar — always on md+, toggled on mobile */}
        <div
          className={`${
            showConversations ? "flex" : "hidden"
          } md:flex absolute md:relative inset-y-0 left-0 z-20 md:z-auto bg-white dark:bg-slate-950 md:bg-transparent`}
        >
          <ConversationsSidebar
            conversations={conversations}
            currentId={conversationId}
            onNew={handleNewChat}
            onSelect={handleSelectConversation}
            loading={loadingConversations}
          />
        </div>

        {/* Overlay to close mobile panels */}
        {(showConversations || showScrolls) && (
          <div
            className="fixed inset-0 z-10 bg-black/20 md:hidden"
            onClick={() => { setShowConversations(false); setShowScrolls(false); }}
          />
        )}

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

        {/* Knowledge / Scrolls panel — always on lg+, toggled on mobile */}
        <div
          className={`${
            showScrolls ? "flex" : "hidden"
          } lg:flex absolute md:relative inset-y-0 right-0 z-20 lg:z-auto w-72 bg-white dark:bg-slate-950 lg:bg-transparent`}
        >
          <aside className="w-72 flex-shrink-0 flex flex-col h-full">
            <KnowledgePanel folders={folders} refreshKey={refreshKey} />
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return <ChatContent />;
}
