"use client";

import { useEffect, useRef } from "react";
import { X, FileText, Download, ScrollText } from "lucide-react";
import { Markdown } from "@/components/ui/markdown";
import { formatDate } from "@/lib/utils";
import type { Note, Folder } from "@/lib/api";

interface ExportScrollModalProps {
  onClose: () => void;
  // Single note mode
  note?: Note;
  folder?: Folder;
  // Collection mode (folder or full library)
  notes?: Note[];
  collectionTitle?: string;
  folderMap?: Map<string, Folder>;
}

function folderBreadcrumb(folder: Folder): string {
  return folder.path
    .split(".")
    .map((s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" → ");
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function tagsHtml(tags: string[]): string {
  if (!tags.length) return "";
  return `<div class="tags">${tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>`;
}

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const PDF_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.65;color:#1a1a2e;background:#fff}
  .doc{max-width:680px;margin:0 auto;padding:48px 40px}
  .brand{font-size:11px;font-weight:700;color:#d97706;letter-spacing:.12em;text-transform:uppercase;margin-bottom:16px}
  /* Single-note header */
  .single-header{border-bottom:2px solid #d97706;padding-bottom:22px;margin-bottom:30px}
  h1.title{font-size:24px;font-weight:700;color:#111827;line-height:1.3;margin-bottom:12px}
  .meta{display:flex;flex-wrap:wrap;gap:14px;font-size:11px;color:#6b7280;margin-top:8px}
  .tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
  .tag{font-size:10px;font-weight:500;color:#d97706;background:#fffbeb;border:1px solid #fde68a;border-radius:999px;padding:2px 9px}
  /* Collection cover */
  .cover{border-bottom:2px solid #d97706;padding-bottom:28px;margin-bottom:36px}
  .cover-title{font-size:28px;font-weight:700;color:#111827;line-height:1.2;margin-bottom:12px}
  .cover-meta{display:flex;gap:16px;font-size:12px;color:#6b7280}
  /* Table of contents */
  .toc-section{margin-bottom:0}
  .toc-heading{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:14px}
  .toc-item{display:flex;align-items:baseline;gap:8px;padding:6px 0;border-bottom:1px dotted #e5e7eb}
  .toc-num{font-size:11px;color:#9ca3af;min-width:22px;flex-shrink:0}
  .toc-title{font-size:13px;color:#1f2937;flex:1}
  .toc-folder{font-size:11px;color:#d97706;flex-shrink:0;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  /* Scroll sections */
  .scroll-section{padding-top:0}
  .scroll-header{border-bottom:1px solid #f3f4f6;padding-bottom:16px;margin-bottom:22px}
  .scroll-folder{font-size:11px;font-weight:600;color:#d97706;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
  .scroll-title{font-size:20px;font-weight:700;color:#111827;line-height:1.3;margin-bottom:8px}
  .scroll-meta{display:flex;gap:12px;font-size:11px;color:#6b7280}
  /* Shared content styles */
  .content{font-size:14px;line-height:1.75;color:#374151}
  .content h1{font-size:19px;font-weight:700;color:#111827;margin:26px 0 10px}
  .content h2{font-size:16px;font-weight:600;color:#1f2937;margin:22px 0 8px}
  .content h3{font-size:14px;font-weight:600;color:#374151;margin:18px 0 6px}
  .content p{margin-bottom:13px}
  .content ul,.content ol{margin:0 0 13px 22px}
  .content li{margin-bottom:4px}
  .content strong{color:#111827;font-weight:600}
  .content em{font-style:italic}
  .content code{font-family:'JetBrains Mono','Fira Code',Consolas,monospace;font-size:12px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:1px 6px;color:#b45309}
  .content pre{background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:16px;overflow-x:auto;margin:14px 0}
  .content pre code{background:none;border:none;padding:0;color:#1e293b;font-size:12px}
  .content blockquote{border-left:3px solid #d97706;padding-left:16px;margin:14px 0;color:#6b7280;font-style:italic}
  .content hr{border:0;border-top:1px solid #e5e7eb;margin:22px 0}
  .footer{margin-top:44px;padding-top:16px;border-top:1px solid #f3f4f6;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between}
  .page-break{page-break-before:always;padding-top:48px;margin-top:0;border-top:2px solid #fde68a}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.doc{padding:24px}}
`;

function openPdfWindow(title: string, bodyHtml: string): void {
  const exportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const win = window.open("", "_blank", "width=820,height=920");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>${PDF_STYLES}</style>
</head>
<body>
  <div class="doc">
    ${bodyHtml}
    <div class="footer">
      <span>Exported from ChatScroll</span>
      <span>${exportDate}</span>
    </div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script>
</body>
</html>`);
  win.document.close();
}

export function ExportScrollModal({
  note,
  folder,
  notes,
  collectionTitle,
  folderMap,
  onClose,
}: ExportScrollModalProps) {
  const isCollection = !!(notes && notes.length > 0 && !note);
  const hiddenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* ── Single note ── */

  const handleSingleMarkdown = () => {
    if (!note) return;
    const tagsLine = note.tags.length
      ? `tags: [${note.tags.map((t) => `"${t}"`).join(", ")}]`
      : "tags: []";
    const md = `---
title: "${note.title}"
folder: "${folder ? folder.path : "general"}"
${tagsLine}
saved: "${note.createdAt}"
source: "ChatScroll"
---

${note.cleanContent}`;
    downloadBlob(md, `${slugify(note.title)}.md`, "text/markdown;charset=utf-8");
  };

  const handleSinglePdf = () => {
    if (!note) return;
    const rendered = document.getElementById("export-scroll-preview");
    const htmlContent = rendered?.innerHTML ?? `<pre>${note.cleanContent}</pre>`;
    const folderLabel = folder ? `${folder.icon ?? "📁"} ${folderBreadcrumb(folder)}` : "";
    openPdfWindow(
      note.title,
      `<div class="brand">📜 ChatScroll</div>
       <div class="single-header">
         <h1 class="title">${note.title}</h1>
         <div class="meta">
           ${folderLabel ? `<span>${folderLabel}</span>` : ""}
           <span>📅 ${fmtDate(note.createdAt)}</span>
           ${note.viewCount > 0 ? `<span>👁 ${note.viewCount} views</span>` : ""}
         </div>
         ${tagsHtml(note.tags)}
       </div>
       <div class="content">${htmlContent}</div>`
    );
  };

  /* ── Collection (folder or library) ── */

  const handleCollectionMarkdown = () => {
    if (!notes) return;
    const title = collectionTitle?.replace(/[^\w\s-]/g, "").trim() ?? "ChatScroll Export";
    const sections = notes.map((n, i) => {
      const f = folderMap?.get(n.folderId);
      const tagsLine = n.tags.length
        ? `Tags: ${n.tags.join(", ")}`
        : "No tags";
      return `## ${i + 1}. ${n.title}

> Folder: ${f ? folderBreadcrumb(f) : "General"} · Saved: ${fmtDate(n.createdAt)}
> ${tagsLine}

${n.cleanContent}`;
    }).join("\n\n---\n\n");

    const md = `---
title: "${title}"
scrolls: ${notes.length}
exported: "${new Date().toISOString().split("T")[0]}"
source: "ChatScroll"
---

# ${title}

${sections}`;
    downloadBlob(md, `${slugify(title)}.md`, "text/markdown;charset=utf-8");
  };

  const handleCollectionPdf = () => {
    if (!notes) return;
    const title = collectionTitle ?? "ChatScroll Library";

    // Table of contents HTML
    const toc = notes.map((n, i) => {
      const f = folderMap?.get(n.folderId);
      return `<div class="toc-item">
        <span class="toc-num">${i + 1}</span>
        <span class="toc-title">${n.title}</span>
        ${f ? `<span class="toc-folder">${f.icon ?? "📁"} ${f.name}</span>` : ""}
      </div>`;
    }).join("");

    // Per-scroll sections — capture rendered HTML from hidden div
    const container = hiddenRef.current;
    const sections = notes.map((n, i) => {
      const f = folderMap?.get(n.folderId);
      const folderLabel = f ? `${f.icon ?? "📁"} ${folderBreadcrumb(f)}` : "";
      const noteDiv = container?.querySelector(`[data-note-idx="${i}"]`);
      const htmlContent = noteDiv?.innerHTML ?? `<pre style="white-space:pre-wrap">${n.cleanContent}</pre>`;

      return `<div class="scroll-section${i > 0 ? " page-break" : ""}">
        <div class="scroll-header">
          ${folderLabel ? `<p class="scroll-folder">${folderLabel}</p>` : ""}
          <h2 class="scroll-title">${n.title}</h2>
          <div class="scroll-meta">
            <span>📅 ${fmtDate(n.createdAt)}</span>
            ${n.viewCount > 0 ? `<span>👁 ${n.viewCount} views</span>` : ""}
          </div>
          ${tagsHtml(n.tags)}
        </div>
        <div class="content">${htmlContent}</div>
      </div>`;
    }).join("\n");

    openPdfWindow(
      title,
      `<div class="brand">📜 ChatScroll</div>
       <div class="cover">
         <h1 class="cover-title">${title}</h1>
         <div class="cover-meta">
           <span>${notes.length} Scroll${notes.length !== 1 ? "s" : ""}</span>
           <span>Exported ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
         </div>
       </div>
       <div class="toc-section">
         <p class="toc-heading">Contents</p>
         ${toc}
       </div>
       ${sections}`
    );
  };

  const handleMarkdown = isCollection ? handleCollectionMarkdown : handleSingleMarkdown;
  const handlePdf = isCollection ? handleCollectionPdf : handleSinglePdf;

  const headerTitle = isCollection
    ? `${collectionTitle ?? "Library"} — ${notes!.length} scroll${notes!.length !== 1 ? "s" : ""}`
    : note?.title ?? "";

  return (
    <>
      {/* Off-screen hidden div for collection PDF HTML capture */}
      {isCollection && (
        <div
          ref={hiddenRef}
          aria-hidden="true"
          style={{ position: "fixed", left: "-9999px", top: 0, width: "680px", pointerEvents: "none" }}
        >
          {notes!.map((n, i) => (
            <div key={n.id} data-note-idx={i}>
              <Markdown content={n.cleanContent} />
            </div>
          ))}
        </div>
      )}

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-4">
              {!isCollection && folder && (
                <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">
                  {folder.icon ?? "📁"} {folderBreadcrumb(folder)}
                </p>
              )}
              <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 line-clamp-2">
                {headerTitle}
              </h2>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {isCollection
                  ? `Exporting ${notes!.length} scroll${notes!.length !== 1 ? "s" : ""} to PDF or Markdown`
                  : note
                    ? <>
                        {formatDate(note.createdAt)}
                        {note.tags.length > 0 && (
                          <span className="ml-2 text-amber-500 dark:text-amber-600">
                            {note.tags.slice(0, 3).map((t) => `#${t}`).join(" ")}
                          </span>
                        )}
                      </>
                    : null}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0">
            {isCollection ? (
              <div className="space-y-1">
                {notes!.map((n) => {
                  const f = folderMap?.get(n.folderId);
                  return (
                    <div
                      key={n.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/40"
                    >
                      <ScrollText className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">{n.title}</p>
                        {f && (
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                            {f.icon ?? "📁"} {f.name}
                          </p>
                        )}
                      </div>
                      {n.tags.length > 0 && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-500 hidden sm:block flex-shrink-0">
                          #{n.tags[0]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div id="export-scroll-preview">
                {note && <Markdown content={note.cleanContent} />}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/60 dark:bg-slate-800/30 flex items-center gap-3">
            <p className="flex-1 text-xs text-gray-400 dark:text-slate-500 hidden sm:block">
              {isCollection ? `${notes!.length} scroll${notes!.length !== 1 ? "s" : ""} · includes all sub-folders` : "Export this scroll"}
            </p>
            <button
              onClick={handleMarkdown}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-slate-300 hover:border-amber-400 dark:hover:border-amber-600 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/10 transition-all"
            >
              <FileText className="w-4 h-4" />
              Download .md
            </button>
            <button
              onClick={handlePdf}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors shadow-sm shadow-amber-500/25"
            >
              <Download className="w-4 h-4" />
              Save as PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
