"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Send, ScrollText, Sparkles } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { SaveNoteModal } from "@/components/SaveNoteModal";
import { formatDate, generateId } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Message, Folder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const STARTER_QUESTIONS = [
  "What are SOLID principles in software design?",
  "Explain how pgvector enables semantic search in Aurora",
  "What's the difference between REST and GraphQL?",
  "How does async/await work in C#?",
  "Explain Docker containers vs virtual machines",
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi there! 👋 I'm ChatScroll AI.\n\nAsk me anything and I'll give you a clear, concise answer. The best answers can be saved as **Scrolls** — your personal knowledge library.",
  timestamp: new Date(),
};

interface ChatPanelProps {
  folders: Folder[];
  onNoteSaved: (folderId: string) => void;
  initialMessage?: string;
  conversationId?: string;
  onFirstMessage?: (msg: string, conversationId: string) => void;
  title?: string;
}

export function ChatPanel({
  folders,
  onNoteSaved,
  initialMessage,
  conversationId,
  onFirstMessage,
  title,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [dismissedSave, setDismissedSave] = useState<Set<string>>(new Set());

  // Typewriter state
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [visibleWordCount, setVisibleWordCount] = useState(0);
  const animationWordsRef = useRef<string[]>([]);
  const animationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ref pattern so auto-send effect is stale-closure-free
  const sendMessageRef = useRef<((text?: string) => void) | null>(null);
  const autoSentRef = useRef(false);
  const firstUserMessageSentRef = useRef(false);

  const { isAuthenticated } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load messages from DynamoDB (via backend) when the panel mounts for a conversation
  useEffect(() => {
    if (!conversationId) { setLoadingHistory(false); return; }

    api.getConversationMessages(conversationId)
      .then((fetched) => {
        if (fetched.length === 0) return; // keep welcome message
        const mapped: Message[] = fetched.map((m) => ({
          id: generateId(),
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.timestamp),
          saved: m.role === "assistant" ? true : undefined, // don't re-prompt save on history load
        }));
        setMessages(mapped);
        firstUserMessageSentRef.current = mapped.some((m) => m.role === "user");
      })
      .catch((err) => {
        console.warn("Failed to load conversation messages from API:", err);
        // Keep welcome message — app still works, just no history loaded
      })
      .finally(() => setLoadingHistory(false));
  }, []); // intentionally empty — only runs on mount (key remount handles conversation switching)

  // Current conversation title derived from messages (for 5A display)
  const conversationTitle = useMemo(() => {
    const firstUser = messages.find((m) => m.role === "user");
    if (!firstUser) return "New Chat";
    const t = firstUser.content.trim();
    return t.length > 40 ? t.slice(0, 40) + "..." : t;
  }, [messages]);

  const isFirstMessage = messages.length === 1 && messages[0].id === "welcome";

  // Scroll when new messages land
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Follow text as it types out
  useEffect(() => {
    if (animatingId) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    }
  }, [visibleWordCount, animatingId]);

  // Typewriter interval
  useEffect(() => {
    if (!animatingId) return;
    const words = animationWordsRef.current;
    if (words.length === 0) return;
    const interval = setInterval(() => {
      setVisibleWordCount((prev) => {
        if (prev >= words.length) {
          clearInterval(interval);
          animationIntervalRef.current = null;
          setAnimatingId(null);
          return prev;
        }
        return prev + 1;
      });
    }, 30);
    animationIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [animatingId]);

  const flushAnimation = useCallback(() => {
    if (animationIntervalRef.current) {
      clearInterval(animationIntervalRef.current);
      animationIntervalRef.current = null;
    }
    setAnimatingId(null);
  }, []);

  // Finish the animation immediately when user switches to another tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && animatingId) flushAnimation();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [animatingId, flushAnimation]);

  const sendMessage = async (text?: string) => {
    flushAnimation();
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const isFirst = !firstUserMessageSentRef.current;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // Notify parent on first user message (for conversation title + sidebar)
    if (isFirst) {
      firstUserMessageSentRef.current = true;
      onFirstMessage?.(content, conversationId ?? "");
    }

    try {
      const history = messages
        .slice(-6)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      const response = await api.sendMessage(content, history, conversationId, !isAuthenticated);

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

      if (assistantMessage.content.trim()) {
        animationWordsRef.current = assistantMessage.content.split(" ");
        setVisibleWordCount(0);
        setAnimatingId(assistantMessage.id);
      }

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

  sendMessageRef.current = sendMessage;

  // Auto-send pending question from landing page
  useEffect(() => {
    if (!initialMessage || autoSentRef.current) return;
    autoSentRef.current = true;
    const timer = setTimeout(() => {
      sendMessageRef.current?.(initialMessage);
    }, 600);
    return () => clearTimeout(timer);
  }, [initialMessage]);

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
    onNoteSaved(folderId);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-transparent">
      {/* Chat header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-800">
        <ScrollText className="w-4 h-4 text-amber-500 dark:text-amber-400" />
        <h2 className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate flex-1">
          {title ?? conversationTitle}
        </h2>
        <span className="text-xs text-gray-400 dark:text-slate-600 flex-shrink-0">
          {messages.length - 1} messages
        </span>
      </div>

      {/* Non-auth history notice */}
      {!isAuthenticated && (
        <div className="px-4 py-2 flex items-center gap-2 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-800/20">
          <span className="text-amber-500 flex-shrink-0 text-xs">💡</span>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Chat history is only saved for signed-in users.{" "}
            <Link href="/login" className="underline hover:text-amber-600 dark:hover:text-amber-300 transition-colors">
              Sign in free
            </Link>{" "}
            to keep your conversations.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loadingHistory && (
          <div className="space-y-4 animate-pulse">
            <div className="flex justify-end"><div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-2xl w-48" /></div>
            <div className="flex gap-3"><div className="w-7 h-7 bg-gray-100 dark:bg-slate-800 rounded-full flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-full" /><div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-5/6" /><div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-4/6" /></div></div>
            <div className="flex justify-end"><div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-2xl w-64" /></div>
            <div className="flex gap-3"><div className="w-7 h-7 bg-gray-100 dark:bg-slate-800 rounded-full flex-shrink-0" /><div className="flex-1 space-y-2"><div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-full" /><div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-3/4" /></div></div>
          </div>
        )}
        {!loadingHistory && messages.map((message) => {
          const isAnimating = message.id === animatingId;

          return (
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
                    <p className="text-sm text-amber-900 dark:text-amber-100">{message.content}</p>
                  ) : isAnimating ? (
                    <p className="text-sm leading-relaxed text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                      {animationWordsRef.current.slice(0, visibleWordCount).join(" ")}
                      <span className="inline-block w-px h-[0.875rem] bg-amber-500 dark:bg-amber-400 animate-pulse align-baseline ml-0.5" />
                    </p>
                  ) : (
                    <Markdown content={message.content} />
                  )}

                  <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">
                    {formatDate(message.timestamp)}
                  </p>
                </div>
              </div>

              {/* Already researched banner — only for authenticated users with their own library */}
              {!isAnimating && message.isAlreadyKnown && message.role === "assistant" && isAuthenticated && (
                <div className="ml-10 mt-2 flex items-start gap-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/40 rounded-xl px-3 py-2.5 animate-in fade-in duration-500">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-amber-700 dark:text-amber-300 font-medium">
                      You&apos;ve researched this before!
                    </span>
                    {message.similarNoteId && message.similarNoteTitle && (
                      <div className="mt-1">
                        <Link
                          href={`/scroll/${message.similarNoteId}?from=chat`}
                          className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 underline underline-offset-2 transition-colors break-all"
                        >
                          📌 {message.similarNoteTitle}
                          {message.similarNoteDate && (
                            <span className="text-gray-400 dark:text-slate-500 no-underline">
                              {" "}— saved {message.similarNoteDate}
                            </span>
                          )}
                        </Link>
                      </div>
                    )}
                    <div className="mt-1 text-gray-400 dark:text-slate-500">
                      Open the link above to review what you saved.
                    </div>
                  </div>
                </div>
              )}

              {/* Save prompt / auth CTA — hidden on AI error responses and duplicate detections */}
              {!isAnimating &&
                message.role === "assistant" &&
                message.folderSuggestion &&
                message.cleanNote &&
                !message.content.startsWith("GEMINI_ERROR:") &&
                !(isAuthenticated && message.isAlreadyKnown) &&
                !message.saved &&
                !dismissedSave.has(message.id) && (
                  <div className="ml-10 mt-2 max-w-sm">
                    {isAuthenticated ? (
                      <SaveNoteModal
                        question={(() => {
                          const idx = messages.findIndex((m) => m.id === message.id);
                          return idx > 0 ? (messages[idx - 1]?.content ?? "") : "";
                        })()}
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
                    ) : (
                      <div className="rounded-xl border border-amber-500/25 bg-transparent px-4 py-2.5 flex items-center gap-3">
                        <span className="text-base flex-shrink-0">📜</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            This answer can be saved as a Scroll
                          </p>
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                            Create a free account to build your knowledge library
                          </p>
                        </div>
                        <Link
                          href="/login"
                          className="text-xs px-3 py-1.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white font-medium flex-shrink-0 whitespace-nowrap transition-colors"
                        >
                          Sign up free
                        </Link>
                        <button
                          onClick={() =>
                            setDismissedSave((prev) => new Set([...prev, message.id]))
                          }
                          className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 flex-shrink-0"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {message.saved && (
                <div className="ml-10 mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 animate-in fade-in duration-300">
                  📜 Saved as a Scroll!
                </div>
              )}
            </div>
          );
        })}

        {/* Loading indicator */}
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

      {/* Input */}
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
