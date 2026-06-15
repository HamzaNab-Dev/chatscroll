"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollText, Menu, X, BookMarked } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { UserMenu } from "@/components/UserMenu";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { api } from "@/lib/api";
import type { Folder } from "@/lib/api";
import { cn } from "@/lib/utils";

function AppContent() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleNoteSaved = () => {
    setRefreshKey((k) => k + 1);
  };

  // Priority 3C: total notes count shown live in header
  const totalNotes = folders.reduce((sum, f) => sum + f.noteCount, 0);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-100 text-sm tracking-tight">
            ChatScroll
          </span>
        </div>

        <span className="text-slate-700 text-xs hidden sm:block">
          Every question becomes lasting knowledge
        </span>

        <div className="ml-auto flex items-center gap-3">
          {/* Priority 3C: live notes count */}
          {totalNotes > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <BookMarked className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-500 font-medium">{totalNotes}</span>
              <span>note{totalNotes !== 1 ? "s" : ""} saved</span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500">Connected</span>
          </div>

          <UserMenu />

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-slate-400 hover:text-slate-200 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
          <ChatPanel folders={folders} onNoteSaved={handleNoteSaved} />
        </main>

        <aside
          className={cn(
            "w-80 flex-shrink-0 flex flex-col",
            "transition-all duration-300",
            "lg:relative lg:translate-x-0",
            sidebarOpen
              ? "fixed inset-y-0 right-0 z-20 translate-x-0 bg-slate-950 shadow-2xl mt-12"
              : "hidden lg:flex"
          )}
        >
          <KnowledgePanel folders={folders} refreshKey={refreshKey} />
        </aside>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <AppContent />
    </ProtectedRoute>
  );
}
