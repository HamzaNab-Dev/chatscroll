const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

function getUserId(): string {
  if (typeof window === "undefined") return "00000000-0000-0000-0000-000000000001";
  let id = localStorage.getItem("cs_user_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cs_user_id", id);
  }
  return id;
}

export type Folder = {
  id: string;
  userId: string;
  name: string;
  path: string;
  icon?: string;
  color?: string;
  parentId?: string;
  noteCount: number;
  createdAt: string;
  children?: Folder[];
};

export type Note = {
  id: string;
  userId: string;
  folderId: string;
  title: string;
  originalQuestion?: string;
  originalAnswer?: string;
  cleanContent: string;
  tags: string[];
  codeLanguage?: string;
  viewCount: number;
  createdAt: string;
};

export type FolderSuggestion = {
  suggestedPath: string;
  suggestedName: string;
  reasoning: string;
  isNewFolder: boolean;
};

export type ChatResponse = {
  answer: string;
  folderSuggestion: FolderSuggestion;
  cleanNote: string;
  isAlreadyKnown: boolean;
  alreadyKnownMessage?: string;
  similarNoteId?: string;
  similarNoteTitle?: string;
  similarNoteDate?: string;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  folderSuggestion?: FolderSuggestion;
  cleanNote?: string;
  isAlreadyKnown?: boolean;
  similarNoteId?: string;
  similarNoteTitle?: string;
  similarNoteDate?: string;
  saved?: boolean;
  timestamp: Date;
};

export type Conversation = {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
};

export type WeeklyActivity = {
  date: string;
  dayLabel: string;
  count: number;
};

export type NotesStats = {
  totalNotes: number;
  weeklyActivity: WeeklyActivity[];
  storageType: string;
};

export type SharedNote = {
  id: string;
  title: string;
  cleanContent: string;
  tags: string[];
  createdAt: string;
  viewCount: number;
  folderName?: string;
  folderIcon?: string;
  folderPath?: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const { headers: extraHeaders, ...restOptions } = options ?? {};
  const res = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": getUserId(),
      ...(extraHeaders as Record<string, string> | undefined),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getFolders: () => request<Folder[]>("/api/folders"),
  getFolderTree: () => request<Folder[]>("/api/folders/tree"),
  createFolder: (data: { name: string; path: string; icon?: string; color?: string; parentId?: string }) =>
    request<Folder>("/api/folders", { method: "POST", body: JSON.stringify(data) }),
  updateFolder: (id: string, data: { name: string; icon?: string }) =>
    request<Folder>(`/api/folders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteFolder: (id: string) =>
    request<void>(`/api/folders/${id}`, { method: "DELETE" }),

  getNotesByFolder: (folderId: string) =>
    request<Note[]>(`/api/notes/folder/${folderId}`),
  getNoteById: (id: string) =>
    request<Note>(`/api/notes/${id}`),
  searchNotes: (query: string, mode: "smart" | "exact" = "exact") =>
    request<Note[]>(`/api/notes/search?q=${encodeURIComponent(query)}&mode=${mode}`),
  semanticSearch: (query: string) =>
    request<{ query: string; results: Note[]; searchType: string }>(`/api/notes/semantic-search?q=${encodeURIComponent(query)}`),
  getNotesStats: () =>
    request<NotesStats>("/api/notes/stats"),
  createNote: (data: {
    folderId: string;
    title: string;
    originalQuestion?: string;
    originalAnswer?: string;
    cleanContent: string;
    tags?: string[];
    codeLanguage?: string;
  }) => request<Note>("/api/notes", { method: "POST", body: JSON.stringify(data) }),
  getAllNotes: () =>
    request<Note[]>("/api/notes/all"),
  getRecentNotes: (limit = 4) =>
    request<Note[]>(`/api/notes/recent?limit=${limit}`),
  incrementViewCount: (id: string) =>
    request<void>(`/api/notes/${id}/view`, { method: "PUT" }),
  deleteNote: (id: string) =>
    request<void>(`/api/notes/${id}`, { method: "DELETE" }),
  updateNote: (id: string, data: { folderId?: string; title?: string; tags?: string[] }) =>
    request<Note>(`/api/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  sendMessage: (message: string, conversationHistory: string, conversationId?: string, isGuest = false) =>
    request<ChatResponse>("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ message, conversationHistory, conversationId, isGuest }),
    }),

  previewChat: (q: string) =>
    request<ChatResponse>(`/api/chat/preview?q=${encodeURIComponent(q)}`),

  getConversations: () => request<Conversation[]>("/api/conversations"),
  createConversation: (title?: string) =>
    request<Conversation>("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  updateConversationTitle: (id: string, title: string, messageCount?: number) =>
    request<void>(`/api/conversations/${id}/title`, {
      method: "PATCH",
      body: JSON.stringify({ title, messageCount }),
    }),
  deleteConversation: (id: string) =>
    request<void>(`/api/conversations/${id}`, { method: "DELETE" }),
  getConversationMessages: (id: string) =>
    request<Array<{ role: string; content: string; timestamp: string }>>(`/api/conversations/${id}/messages`),

  getSharedNote: (id: string) =>
    request<SharedNote>(`/api/notes/shared/${id}`),

  getAiStatus: () =>
    request<{ aiService: string; isRealAi: boolean; model: string; status: string }>("/api/chat/ai-status"),

  getDatabaseHealth: () =>
    request<Record<string, unknown>>("/api/health/database"),
};
