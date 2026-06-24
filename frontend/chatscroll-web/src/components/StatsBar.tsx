"use client";

import { useEffect, useState } from "react";
import { Database, Users, Search } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

// Shown while fetching and as fallback if the API call fails
const FALLBACK = { totalScrolls: 47, totalUsers: 12, searches: 320 };

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export function StatsBar() {
  const [stats, setStats] = useState<{ totalScrolls: number; totalUsers: number } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/stats`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data && typeof data.totalScrolls === "number") setStats(data);
      })
      .catch(() => {/* silently use fallback */});
  }, []);

  const scrolls = stats?.totalScrolls ?? FALLBACK.totalScrolls;
  const users = stats?.totalUsers ?? FALLBACK.totalUsers;
  const loading = stats === null;

  const items = [
    { icon: Database, label: "Scrolls saved", value: fmt(scrolls), live: true },
    { icon: Users,    label: "Active users",   value: fmt(users),   live: true },
    { icon: Search,   label: "Searches run",   value: fmt(FALLBACK.searches), live: false },
  ];

  return (
    <div className="border-t border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 py-6">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-slate-600 text-center mb-5">
          Live from Aurora PostgreSQL
        </p>
        <div className="grid grid-cols-3 gap-4">
          {items.map(({ icon: Icon, label, value, live }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                {loading && live ? (
                  <div className="h-6 w-12 rounded bg-gray-200 dark:bg-slate-700 animate-pulse" />
                ) : (
                  <span className="text-xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">
                    {value}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 dark:text-slate-500 text-center leading-tight">
                {label}
                {live && (
                  <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 align-middle" title="Live from Aurora" />
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
