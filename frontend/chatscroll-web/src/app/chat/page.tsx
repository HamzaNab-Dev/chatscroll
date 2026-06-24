"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
const PINNED_KEY = "cs_pinned_convs";

function ChatContent() {
  const { isAuthenticated, authState } = useAuth();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => {
    try {
      const v = typeof window !== "undefined" ? localStorage.getItem(PINNED_KEY) : null;
      return v ? new Set(JSON.parse(v) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  // Mobile panel visibility
  const [showConversations, setShowConversations] = useState(false);
  const [showScrolls, setShowScrolls] = useState(false);

  // Prevents double-init when authState.status changes from "loading" → settled
  const hasInitRef = useRef(false);

  // Capture the stored last-conv ID synchronously at mount, before any effects can overwrite it.
  // The persist effect below runs after first render and would clobber the stored value with the
  // initial random UUID — reading it here in a ref avoids that race.
  const storedLastConvRef = useRef<string | null>(
    typeof window !== "undefined" ? localStorage.getItem(LAST_CONV_KEY) : null
  );

  // Persist pinned IDs to localStorage
  useEffect(() => {
    try { localStorage.setItem(PINNED_KEY, JSON.stringify([...pinnedIds])); } catch {}
  }, [pinnedIds]);

  // Persist the active conversation so we can restore it on refresh / back-nav
  useEffect(() => {
    if (conversationId) {
      try { localStorage.setItem(LAST_CONV_KEY, conversationId); } catch {}
    }
  }, [conversationId]);

  // Cache conversation list for offline/error fallback
  useEffect(() => {
    if (conversations.length > 0) {
      try { localStorage.setItem(CONV_CACHE_KEY, JSON.stringify(conversations)); } catch {}
    }
  }, [conversations]);

  // Main init — waits for auth to settle so "loading" is never mistaken for "unauthenticated"
  useEffect(() => {
    if (authState.status === "loading") return;
    if (hasInitRef.current) return;
    hasInitRef.current = true;

    const pending = (() => {
      try { const v = sessionStorage.getItem("pendingQuestion"); if (v) sessionStorage.removeItem("pendingQuestion"); return v; }
      catch { return null; }
    })();
    const forceNew = (() => {
      try { const v = sessionStorage.getItem("cs_force_new"); if (v) sessionStorage.removeItem("cs_force_new"); return v === "1"; }
      catch { return false; }
    })();
    const shouldForceNew = !!pending || forceNew;

    const initConversations = async () => {
      if (!isAuthenticated) {
        // Clear any cached history so non-auth users never see another user's conversations
        try { localStorage.removeItem(LAST_CONV_KEY); } catch {}
        try { localStorage.removeItem(CONV_CACHE_KEY); } catch {}
        setConversations([]);
        setLoadingConversations(false);
        if (pending) setInitialMessage(pending);
        return;
      }

      const lastId = storedLastConvRef.current;

      try {
        const convs = await api.getConversations();
        const mapped: ConversationItem[] = convs.map((c) => ({
          id: c.id,
          title: c.title || "New Chat",
          updatedAt: new Date(c.updatedAt),
        }));
        setConversations(mapped);

        if (!shouldForceNew && mapped.length > 0) {
          // Refresh or back-nav: restore the exact conversation the user was on
          const resume = lastId ? mapped.find((c) => c.id === lastId) : null;
          setConversationId(resume ? resume.id : mapped[0].id);
        } else {
          // Nav Chat click, home page send, or no existing convs.
          // Use a client-side UUID — backend creates the Aurora record on the first message.
          setConversationId(crypto.randomUUID());
          if (pending) setInitialMessage(pending);
        }
      } catch (err) {
        console.warn("Failed to load conversations from API, restoring from cache:", err);
        try {
          if (!shouldForceNew) {
            const cached = localStorage.getItem(CONV_CACHE_KEY);
            if (cached) {
              const parsed = JSON.parse(cached) as Array<{ id: string; title: string; updatedAt: string }>;
              const restored = parsed.map((c) => ({ ...c, updatedAt: new Date(c.updatedAt) }));
              setConversations(restored);
              const target = lastId ? restored.find((c) => c.id === lastId) : null;
              const fallback = target ?? restored[0];
              if (fallback) setConversationId(fallback.id);
            }
          } else if (pending) {
            setInitialMessage(pending);
          }
        } catch {}
      } finally {
        setLoadingConversations(false);
      }
    };

    initConversations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.status]);

  const loadFolders = useCallback(async () => {
    if (!isAuthenticated) { setFoldersLoading(false); return; }
    try {
      const data = await api.getFolders();
      setFolders(data);
    } catch (err) {
      console.error("Failed to load folders:", err);
    } finally {
      setFoldersLoading(false);
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

  // New chat: just use a fresh UUID — no API call; backend creates Aurora record on first message
  const handleNewChat = () => {
    setConversationId(crypto.randomUUID());
    setInitialMessage(undefined);
    setShowConversations(false);
  };

  const handleSelectConversation = (id: string) => {
    setConversationId(id);
    setInitialMessage(undefined);
    setShowConversations(false);
  };

  const handleDeleteConversation = async (id: string) => {
    // Optimistic update first
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    setPinnedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });

    if (conversationId === id) {
      setConversationId(remaining.length > 0 ? remaining[0].id : crypto.randomUUID());
      setInitialMessage(undefined);
    }

    try { await api.deleteConversation(id); }
    catch { console.warn("Failed to delete conversation from API"); }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
    try { await api.updateConversationTitle(id, newTitle); }
    catch { console.warn("Failed to rename conversation"); }
  };

  const handlePinConversation = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Called by ChatPanel when the first user message is sent
  const handleFirstMessage = useCallback((msg: string, convId: string) => {
    const title = msg.length > 45 ? msg.slice(0, 45) + "..." : msg;

    setConversations((prev) => {
      const existing = prev.find((c) => c.id === convId);
      if (existing) {
        return prev.map((c) =>
          c.id === convId ? { ...c, title, updatedAt: new Date() } : c
        );
      }
      // New conversation just created — add it to the top of the sidebar
      return [{ id: convId, title, updatedAt: new Date() }, ...prev];
    });

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
            pinnedIds={pinnedIds}
            onNew={handleNewChat}
            onSelect={handleSelectConversation}
            onDelete={handleDeleteConversation}
            onRename={handleRenameConversation}
            onPin={handlePinConversation}
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
            foldersLoading={foldersLoading}
            onNoteSaved={handleNoteSaved}
            initialMessage={initialMessage}
            conversationId={conversationId}
            onFirstMessage={handleFirstMessage}
            title={conversations.find((c) => c.id === conversationId)?.title}
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
