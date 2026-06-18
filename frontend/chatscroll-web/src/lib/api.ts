const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getFolders: () => request<Folder[]>("/api/folders"),
  getFolderTree: () => request<Folder[]>("/api/folders/tree"),
  createFolder: (data: { name: string; path: string; icon?: string; color?: string; parentId?: string }) =>
    request<Folder>("/api/folders", { method: "POST", body: JSON.stringify(data) }),
  deleteFolder: (id: string) =>
    request<void>(`/api/folders/${id}`, { method: "DELETE" }),

  getNotesByFolder: (folderId: string) =>
    request<Note[]>(`/api/notes/folder/${folderId}`),
  getNoteById: (id: string) =>
    request<Note>(`/api/notes/${id}`),
  searchNotes: (query: string) =>
    request<Note[]>(`/api/notes/search?q=${encodeURIComponent(query)}`),
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

  sendMessage: (message: string, conversationHistory: string) =>
    request<ChatResponse>("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({ message, conversationHistory }),
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

  getAiStatus: () =>
    request<{ aiService: string; isRealAi: boolean; model: string; status: string }>("/api/chat/ai-status"),

  getDatabaseHealth: () =>
    request<Record<string, unknown>>("/api/health/database"),
};
