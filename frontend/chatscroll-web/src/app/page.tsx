"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Library, BookOpen, Zap, ScrollText, TrendingUp } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Note, NotesStats } from "@/lib/api";
import { formatDate } from "@/lib/utils";

function getGreeting(name: string) {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
      <div className="h-8 bg-gray-100 dark:bg-slate-800 rounded w-1/3 mb-2" />
      <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
    </div>
  );
}

function ScrollCard({ note }: { note: Note }) {
  return (
    <Link
      href={`/scroll/${note.id}`}
      className="group rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 hover:border-amber-300 dark:hover:border-amber-700/40 hover:shadow-sm transition-all block"
    >
      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors mb-1">
        {note.title}
      </p>
      <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-2 mb-3">
        {note.cleanContent.replace(/[#*`]/g, "").slice(0, 100)}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400 dark:text-slate-600">
          {formatDate(note.createdAt)}
        </span>
        {note.tags.length > 0 && (
          <span className="text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-full px-2 py-0.5">
            {note.tags[0]}
          </span>
        )}
      </div>
    </Link>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [stats, setStats] = useState<NotesStats | null>(null);
  const [recentScrolls, setRecentScrolls] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const [statsData, recentData] = await Promise.all([
        api.getNotesStats(),
        api.getRecentNotes(4),
      ]);
      setStats(statsData);
      setRecentScrolls(recentData);
    } catch {
      // silently continue with empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const thisWeekTotal = stats?.weeklyActivity?.reduce((s, d) => s + d.count, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">
            {user ? getGreeting(user.displayName) : "Welcome back"}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">
            {stats
              ? `You have ${stats.totalNotes} scroll${stats.totalNotes !== 1 ? "s" : ""} in your library.`
              : "Your personal knowledge library"}
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ScrollText className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-gray-400 dark:text-slate-500">Total Scrolls</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                  {stats?.totalNotes ?? 0}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">saved to library</p>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs text-gray-400 dark:text-slate-500">This Week</span>
                </div>
                <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
                  {thisWeekTotal}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-600 mt-1">new scrolls added</p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-xl border border-amber-200 dark:border-amber-800/30 bg-amber-50 dark:bg-amber-950/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">Activity</span>
                </div>
                {stats?.weeklyActivity && stats.weeklyActivity.length > 0 ? (
                  <div className="flex items-end gap-1 h-10">
                    {stats.weeklyActivity.map((day) => {
                      const max = Math.max(...stats.weeklyActivity.map((d) => d.count), 1);
                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center gap-0.5"
                          title={`${day.dayLabel}: ${day.count}`}
                        >
                          <div
                            className="w-full bg-amber-400/60 dark:bg-amber-500/50 rounded-t-sm"
                            style={{ height: `${Math.max(2, (day.count / max) * 32)}px` }}
                          />
                          <span className="text-[9px] text-amber-600/60 dark:text-amber-600/60">
                            {day.dayLabel[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600/60 dark:text-amber-400/60 mt-2">
                    Start chatting to see activity
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Start chatting
          </Link>
          <Link
            href="/library"
            className="flex items-center justify-center gap-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-amber-300 dark:hover:border-amber-600/40 hover:text-amber-700 dark:hover:text-amber-300 px-6 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            <Library className="w-4 h-4" />
            Browse Scroll Library
          </Link>
        </div>

        {/* Recent Scrolls */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-semibold text-gray-800 dark:text-slate-200">
                Recent Scrolls
              </h2>
            </div>
            {recentScrolls.length > 0 && (
              <Link
                href="/library"
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors"
              >
                View all →
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4 animate-pulse"
                >
                  <div className="h-3.5 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-full mb-1" />
                  <div className="h-2.5 bg-gray-100 dark:bg-slate-800 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : recentScrolls.length === 0 ? (
            <div className="text-center py-14 rounded-xl border border-dashed border-gray-300 dark:border-slate-700">
              <ScrollText className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-slate-500">
                No scrolls yet
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-600 mt-1 mb-4">
                Start a chat and save your first scroll
              </p>
              <Link
                href="/chat"
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium"
              >
                Go to Chat →
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {recentScrolls.map((note) => (
                <ScrollCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
