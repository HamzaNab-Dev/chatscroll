"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Sun, Moon, ArrowRight, Menu, X } from "lucide-react";
import { UserMenu } from "@/components/UserMenu";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/chat", label: "Chat" },
  { href: "/library", label: "Library" },
];

export function Navigation() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 relative flex items-center px-6 pb-4 border-b border-gray-200 dark:border-slate-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex-shrink-0"
      style={{ paddingTop: "max(env(safe-area-inset-top), 1rem)" }}
    >
      {/* Logo — left anchor */}
      <div className="flex-1 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="ChatScroll" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-gray-900 dark:text-slate-100 text-sm tracking-tight hidden sm:block">
            ChatScroll
          </span>
        </Link>
      </div>

      {/* Center nav — hidden on mobile, visible on md+ */}
      {isAuthenticated ? (
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                if (link.href === "/chat" && pathname !== "/chat") {
                  try { sessionStorage.setItem("cs_force_new", "1"); } catch {}
                }
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 font-medium",
                pathname === link.href
                  ? "bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-300"
                  : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/aws-showcase"
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 font-medium",
              pathname === "/aws-showcase"
                ? "bg-amber-100 dark:bg-amber-600/20 text-amber-700 dark:text-amber-300"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
            )}
          >
            🏗️ Architecture
          </Link>
        </nav>
      ) : (
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500 dark:text-slate-400">
          <a href="/#features" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Features</a>
          <a href="/#how-it-works" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">How it works</a>
          <a href="/#pricing" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Pricing</a>
          <Link href="/aws-showcase" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">🏗️ Architecture</Link>
        </nav>
      )}

      {/* Right controls — right anchor, flex-1 + justify-end balances the left side */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {isAuthenticated ? (
          <>
            <button
              onClick={() => setShowMobileMenu((v) => !v)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <UserMenu />
          </>
        ) : (
          <>
            <button
              onClick={() => setShowMobileMenu((v) => !v)}
              className="md:hidden p-1.5 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}
      </div>

      {/* Outside-click backdrop */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMobileMenu(false)} />
      )}

      {/* Mobile dropdown — both auth states */}
      {showMobileMenu && (
        <div className="absolute top-full left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 flex flex-col py-2 md:hidden z-50">
          {isAuthenticated ? (
            <>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setShowMobileMenu(false);
                    if (link.href === "/chat" && pathname !== "/chat") {
                      try { sessionStorage.setItem("cs_force_new", "1"); } catch {}
                    }
                  }}
                  className={cn(
                    "px-6 py-3 text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/aws-showcase"
                onClick={() => setShowMobileMenu(false)}
                className={cn(
                  "px-6 py-3 text-sm font-medium transition-colors",
                  pathname === "/aws-showcase"
                    ? "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                )}
              >
                🏗️ Architecture
              </Link>
            </>
          ) : (
            <>
              <a href="/#features" onClick={() => setShowMobileMenu(false)} className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Features</a>
              <a href="/#how-it-works" onClick={() => setShowMobileMenu(false)} className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">How it works</a>
              <a href="/#pricing" onClick={() => setShowMobileMenu(false)} className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Pricing</a>
              <Link href="/aws-showcase" onClick={() => setShowMobileMenu(false)} className="px-6 py-3 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">🏗️ Architecture</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
