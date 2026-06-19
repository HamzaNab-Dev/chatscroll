"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sun, Moon } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/library", label: "Library" },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [scrollCount, setScrollCount] = useState<number | null>(null);

  // Fetch total scroll count for the Library badge (5D)
  useEffect(() => {
    if (!isAuthenticated) return;
    api.getNotesStats()
      .then((s) => setScrollCount(s.totalNotes))
      .catch(() => {});
  }, [isAuthenticated]);

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-10 flex-shrink-0">
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <Image src="/logo.png" alt="ChatScroll" width={28} height={28} className="rounded-lg" />
        <span className="font-bold text-gray-900 dark:text-slate-100 text-sm tracking-tight hidden sm:block">
          ChatScroll
        </span>
      </Link>

      {isAuthenticated ? (
        <nav className="flex items-center gap-1 mx-auto">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5",
                pathname === link.href
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              )}
            >
              {link.label}
              {link.label === "Library" && scrollCount !== null && scrollCount > 0 && (
                <span
                  className={cn(
                    "text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none",
                    pathname === link.href
                      ? "bg-amber-200 dark:bg-amber-700/50 text-amber-800 dark:text-amber-200"
                      : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {scrollCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      ) : (
        <div className="flex-1" />
      )}

      <div className="flex items-center gap-2 flex-shrink-0">
        {isAuthenticated ? (
          <>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <UserMenu />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
