"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, ScrollText, Lightbulb, Sparkles } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { SaveNoteModal } from "@/components/SaveNoteModal";
import { formatDate, generateId } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Message, Folder } from "@/lib/api";
import { cn } from "@/lib/utils";

const STARTER_QUESTIONS = [
  "What are SOLID principles in software design?",
  "Explain how pgvector enables semantic search",
  "What's the difference between REST and GraphQL?",
];

interface ChatPanelProps {
  folders: Folder[];
  onNoteSaved: () => void;
}

export function ChatPanel({ folders, onNoteSaved }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 **Welcome to ChatScroll!**\n\nAsk me anything — about programming, medicine, history, or any topic you want to learn about. I'll answer your questions and help you save the best answers to your personal knowledge tree.\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [dismissedSave, setDismissedSave] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isFirstMessage = messages.length === 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const response = await api.sendMessage(content, history);

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: response.answer,
        folderSuggestion: response.folderSuggestion,
        cleanNote: response.cleanNote,
        isAlreadyKnown: response.isAlreadyKnown,
        similarNoteId: response.similarNoteId,
        similarNoteTitle: response.similarNoteTitle,
        similarNoteDate: response.similarNoteDate,
        saved: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content:
            "Sorry, I encountered an error. Please make sure the backend is running and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSaveNote = async (
    messageId: string,
    folderId: string,
    title: string,
    message: Message
  ) => {
    if (!message.cleanNote) return;

    const msgIndex = messages.findIndex((m) => m.id === messageId);
    const userQuestion = msgIndex > 0 ? messages[msgIndex - 1]?.content : undefined;

    await api.createNote({
      folderId,
      title,
      originalQuestion: userQuestion,
      originalAnswer: message.content,
      cleanContent: message.cleanNote,
      tags: [],
    });

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, saved: true } : m))
    );
    onNoteSaved();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-transparent">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800">
        <ScrollText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        <h2 className="text-sm font-medium text-gray-800 dark:text-slate-200">Chat</h2>
        <span className="text-xs text-gray-400 dark:text-slate-600 ml-auto">
          {messages.length - 1} messages
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 pb-3 border-b border-gray-100 dark:border-slate-800/50 last:border-0 last:pb-0"
          >
            <div
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold",
                  message.role === "user"
                    ? "bg-amber-600 text-white"
                    : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300"
                )}
              >
                {message.role === "user" ? "H" : "AI"}
              </div>

              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-amber-50 border border-amber-200 dark:bg-amber-700/30 dark:border-amber-600/30"
                    : "bg-gray-50 border border-gray-200 dark:bg-slate-800/60 dark:border-slate-700/50"
                )}
              >
                {message.role === "user" ? (
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    {message.content}
                  </p>
                ) : (
                  <Markdown content={message.content} />
                )}

                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
                  {formatDate(message.timestamp)}
                </p>
              </div>
            </div>

            {/* Enhanced "Already Know This" banner */}
            {message.isAlreadyKnown && message.role === "assistant" && (
              <div className="ml-10 mt-2 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/40 rounded-xl px-3 py-2.5 animate-in fade-in duration-500">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-amber-700 dark:text-amber-300 font-medium">
                    You&apos;ve researched this before!
                  </span>
                  {message.similarNoteTitle && (
                    <div className="mt-1 text-amber-600 dark:text-amber-200/70">
                      📌 &ldquo;{message.similarNoteTitle}&rdquo;
                      {message.similarNoteDate && (
                        <span className="text-gray-400 dark:text-slate-500">
                          {" "}— saved {message.similarNoteDate}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-1 text-gray-400 dark:text-slate-500">
                    Check your Knowledge Tree to review what you saved.
                  </div>
                </div>
              </div>
            )}

            {message.role === "assistant" &&
              message.folderSuggestion &&
              message.cleanNote &&
              !message.saved &&
              !dismissedSave.has(message.id) && (
                <div className="ml-10 mt-2">
                  <SaveNoteModal
                    question={
                      (() => {
                        const idx = messages.findIndex((m) => m.id === message.id);
                        return idx > 0 ? (messages[idx - 1]?.content ?? "") : "";
                      })()
                    }
                    cleanNote={message.cleanNote}
                    folderSuggestion={message.folderSuggestion}
                    folders={folders}
                    onSave={(folderId, title) =>
                      handleSaveNote(message.id, folderId, title, message)
                    }
                    onDismiss={() =>
                      setDismissedSave((prev) => new Set([...prev, message.id]))
                    }
                  />
                </div>
              )}

            {message.saved && (
              <div className="ml-10 mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in duration-300">
                ✅ Saved to your knowledge tree
              </div>
            )}
          </div>
        ))}

        {/* Animated typing indicator */}
        {loading && (
          <div className="flex gap-3 animate-in fade-in duration-200">
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-xs text-gray-600 dark:text-slate-300 font-bold flex-shrink-0">
              AI
            </div>
            <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Starter questions */}
      {isFirstMessage && !loading && (
        <div className="px-4 pb-3">
          <p className="text-xs text-gray-400 dark:text-slate-600 mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-600" />
            Try asking:
          </p>
          <div className="flex flex-col gap-1.5">
            {STARTER_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-left text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 rounded-lg px-3 py-2 hover:bg-amber-50 dark:hover:bg-slate-800 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-200 dark:hover:border-amber-600/30 transition-all duration-200"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 bg-gray-50 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/50 resize-none min-h-[44px] max-h-32 transition-colors"
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
            }}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            size="sm"
            className="bg-amber-600 hover:bg-amber-500 text-white h-11 w-11 p-0 flex-shrink-0 rounded-xl disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 text-center">
          Powered by Gemini 2.5 Flash · ChatScroll
        </p>
      </div>
    </div>
  );
}
