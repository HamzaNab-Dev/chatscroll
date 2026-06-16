"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

interface MarkdownProps {
  content: string;
  className?: string;
}

type CodeProps = ComponentProps<"code"> & { className?: string };

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("text-gray-700 dark:text-slate-300", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-3">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-2 mt-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-700 dark:text-slate-300 mb-2 mt-3">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 dark:text-slate-300 mb-3 leading-relaxed">{children}</p>
          ),
          code: ({ children, className: codeClass }: CodeProps) => {
            const isBlock = codeClass?.includes("language-");
            return isBlock ? (
              <code className="block bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-200 font-mono overflow-x-auto my-3">
                {children}
              </code>
            ) : (
              <code className="bg-gray-100 dark:bg-slate-800 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-4 overflow-x-auto my-3">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-slate-300 mb-3 ml-2">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-slate-300 mb-3 ml-2">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 dark:text-slate-300">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-amber-400 dark:border-amber-500 pl-4 text-gray-500 dark:text-slate-400 italic my-3">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="text-gray-900 dark:text-slate-100 font-semibold">{children}</strong>
          ),
          hr: () => <hr className="border-gray-200 dark:border-slate-700 my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
