import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Folder } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildFolderTree(folders: Folder[]): Folder[] {
  const map = new Map<string, Folder>();
  const roots: Folder[] = [];

  folders.forEach((f) => {
    map.set(f.id, { ...f, children: [] });
  });

  map.forEach((folder) => {
    if (folder.parentId) {
      const parent = map.get(folder.parentId);
      if (parent) {
        parent.children = parent.children ?? [];
        parent.children.push(folder);
      } else {
        roots.push(folder);
      }
    } else {
      roots.push(folder);
    }
  });

  return roots;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2);
}
