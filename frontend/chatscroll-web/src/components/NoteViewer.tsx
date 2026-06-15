"use client";

import { ArrowLeft, Tag, Calendar, Eye, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { formatDate } from "@/lib/utils";
import type { Note } from "@/lib/api";

interface NoteViewerProps {
  note: Note;
  onBack: () => void;
  relatedNotes?: Note[];
  onViewRelatedNote?: (note: Note) => void;
}

export function NoteViewer({ note, onBack, relatedNotes, onViewRelatedNote }: NoteViewerProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-slate-800">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-medium text-slate-200 flex-1 truncate">
          {note.title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(note.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {note.viewCount} views
          </span>
        </div>

        {note.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 text-slate-500" />
            {note.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs border-slate-700 text-slate-400"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {note.originalQuestion && (
          <div className="rounded-lg bg-slate-800/50 border border-slate-700 p-3">
            <p className="text-xs text-slate-500 mb-1">Original question</p>
            <p className="text-sm text-slate-300">{note.originalQuestion}</p>
          </div>
        )}

        <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-4">
          <Markdown content={note.cleanContent} />
        </div>

        {/* Priority 4C: Related Notes section */}
        {relatedNotes && relatedNotes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Link2 className="w-3.5 h-3.5 text-slate-500" />
              <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Related notes
              </h3>
            </div>
            <div className="space-y-1.5">
              {relatedNotes.map((related) => (
                <button
                  key={related.id}
                  onClick={() => onViewRelatedNote?.(related)}
                  className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-700/60 bg-slate-800/30 hover:border-amber-500/30 hover:bg-slate-800/60 transition-all group"
                >
                  <p className="text-xs text-slate-300 font-medium truncate group-hover:text-amber-200 transition-colors">
                    {related.title}
                  </p>
                  {related.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {related.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-slate-600 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
