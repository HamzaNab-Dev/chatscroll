"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollText, Sun, Moon } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/library", label: "Library" },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-10 flex-shrink-0">
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <ScrollText className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 dark:text-slate-100 text-sm tracking-tight hidden sm:block">
          ChatScroll
        </span>
      </Link>

      <nav className="flex items-center gap-1 mx-auto">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors",
              pathname === link.href
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-medium"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
