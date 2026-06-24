"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ScrollText, FolderOpen, MessageSquare, Pencil, Check,
  AlertCircle, Lock, LogOut, Loader2, Eye, EyeOff,
  ArrowLeft, BadgeCheck, ShieldAlert,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { api, type UserMe } from "@/lib/api";
import { isCognitoConfigured } from "@/lib/auth-config";
import { cn } from "@/lib/utils";

const PASSWORD_REQS = [
  { label: "At least 8 characters",         test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",     test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)",     test: (p: string) => /[a-z]/.test(p) },
  { label: "One number (0–9)",               test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$…)",  test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
];

function StatusMsg({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs mt-2", type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
      {type === "success" ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
      {msg}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4 py-4 text-center">
      <Icon className="w-5 h-5 mx-auto mb-1.5 text-amber-500 dark:text-amber-400" />
      <p className="text-xl font-bold text-gray-900 dark:text-slate-100 tabular-nums">{value}</p>
      <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function ProfileContent() {
  const { user, signOut, updatePassword } = useAuth();
  const router = useRouter();

  const [me, setMe] = useState<UserMe | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  // Inline name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Change password
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    api.getMe()
      .then((data) => { setMe(data); setNameValue(data.displayName); })
      .catch(() => {})
      .finally(() => setMeLoading(false));
  }, []);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim() === me?.displayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    setNameStatus(null);
    try {
      await api.updateMe({ displayName: nameValue.trim() });
      setMe((prev) => prev ? { ...prev, displayName: nameValue.trim() } : prev);
      setNameStatus({ type: "success", msg: "Name updated." });
      setEditingName(false);
    } catch {
      setNameStatus({ type: "error", msg: "Failed to save name." });
    } finally {
      setSavingName(false);
    }
  };

  const pwStrengthCount = PASSWORD_REQS.filter((r) => r.test(newPw)).length;
  const pwStrengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"][pwStrengthCount] ?? "";
  const pwStrengthColor = pwStrengthCount <= 1 ? "bg-red-500" : pwStrengthCount <= 2 ? "bg-orange-400" : pwStrengthCount <= 3 ? "bg-amber-400" : "bg-emerald-500";
  const pwStrengthText  = pwStrengthCount <= 1 ? "text-red-500" : pwStrengthCount <= 2 ? "text-orange-400" : pwStrengthCount <= 3 ? "text-amber-500" : "text-emerald-500";

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) { setPwStatus({ type: "error", msg: "New passwords don't match." }); return; }
    if (pwStrengthCount < 4) { setPwStatus({ type: "error", msg: "Password isn't strong enough." }); return; }
    setSavingPw(true);
    setPwStatus(null);
    try {
      await updatePassword(oldPw, newPw);
      setPwStatus({ type: "success", msg: "Password changed successfully." });
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwStatus({ type: "error", msg: err instanceof Error ? err.message : "Failed to change password." });
    } finally {
      setSavingPw(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!user) return null;

  const initials = user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
  const displayName = me?.displayName ?? user.displayName;
  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10 sm:px-6 space-y-5">

        {/* Back link */}
        <Link href="/library" className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Library
        </Link>

        {/* Header card */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-6 py-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Editable display name */}
            <div className="flex items-center gap-2 mb-1">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") { setEditingName(false); setNameValue(me?.displayName ?? user.displayName); }
                  }}
                  onBlur={handleSaveName}
                  className="flex-1 text-lg font-bold bg-gray-50 dark:bg-slate-800 border border-amber-400 dark:border-amber-500/50 rounded-lg px-3 py-1 text-gray-900 dark:text-slate-100 focus:outline-none"
                />
              ) : (
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">{displayName}</p>
              )}
              <button
                onClick={() => { setEditingName(true); setNameValue(displayName); setNameStatus(null); }}
                disabled={savingName}
                className="p-1 rounded-md text-gray-300 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                title="Edit display name"
              >
                {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pencil className="w-3.5 h-3.5" />}
              </button>
            </div>

            {nameStatus && <StatusMsg {...nameStatus} />}

            <p className="text-sm text-gray-400 dark:text-slate-500 truncate">{me?.email ?? user.email}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Plan badge */}
              <span className="text-xs border border-amber-400 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 rounded-full px-2.5 py-0.5 capitalize font-medium">
                {me?.plan ?? user.plan} plan
              </span>

              {/* Verified / dev badge */}
              {isCognitoConfigured ? (
                user.emailVerified ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700/50 rounded-full px-2.5 py-0.5">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-orange-500 dark:text-orange-400 border border-orange-300 dark:border-orange-700/50 rounded-full px-2.5 py-0.5">
                    <ShieldAlert className="w-3 h-3" /> Unverified
                  </span>
                )
              ) : (
                <span className="text-xs text-gray-400 dark:text-slate-500 border border-gray-300 dark:border-slate-700 rounded-full px-2.5 py-0.5">
                  Dev mode
                </span>
              )}

              {/* Member since */}
              {memberSince && (
                <span className="text-xs text-gray-400 dark:text-slate-500">
                  Member since {memberSince}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {meLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4 py-4 text-center animate-pulse">
                <div className="h-5 w-5 bg-gray-200 dark:bg-slate-700 rounded mx-auto mb-2" />
                <div className="h-6 w-8 bg-gray-200 dark:bg-slate-700 rounded mx-auto mb-1" />
                <div className="h-3 w-16 bg-gray-100 dark:bg-slate-800 rounded mx-auto" />
              </div>
            ))
          ) : (
            <>
              <StatCard icon={ScrollText}     label="Scrolls saved"  value={me?.totalScrolls ?? 0} />
              <StatCard icon={FolderOpen}     label="Folders"        value={me?.totalFolders ?? 0} />
              <StatCard icon={MessageSquare}  label="Conversations"  value={me?.totalConversations ?? 0} />
            </>
          )}
        </div>

        {/* Change password — only when Cognito is configured */}
        {isCognitoConfigured && (
          <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
              <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">Change Password</h2>
            </div>
            <div className="px-6 py-5 space-y-3">
              {/* Old password */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Current password</label>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    value={oldPw}
                    onChange={(e) => setOldPw(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/40"
                  />
                  <button type="button" onClick={() => setShowOld((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                    {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password + strength */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">New password</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/40"
                  />
                  <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPw.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {PASSWORD_REQS.map((_, i) => (
                          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < pwStrengthCount ? pwStrengthColor : "bg-gray-200 dark:bg-slate-700")} />
                        ))}
                      </div>
                      <span className={cn("text-xs font-semibold min-w-[68px] text-right", pwStrengthText)}>{pwStrengthLabel}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/40"
                />
              </div>

              <button
                onClick={handleChangePassword}
                disabled={savingPw || !oldPw || !newPw || !confirmPw}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
              >
                {savingPw ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Update Password"}
              </button>
              {pwStatus && <StatusMsg {...pwStatus} />}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-6 py-5">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/library"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              My Library
            </Link>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Start Chatting
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-red-200 dark:border-red-900/40 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
