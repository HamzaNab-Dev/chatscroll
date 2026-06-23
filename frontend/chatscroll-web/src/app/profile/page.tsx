"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { isCognitoConfigured } from "@/lib/auth-config";
import {
  User,
  Lock,
  LogOut,
  Check,
  AlertCircle,
  Zap,
  ScrollText,
  FolderOpen,
  Eye,
} from "lucide-react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-slate-200">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function StatusMsg({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs mt-3 ${type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
      {type === "success" ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
      {msg}
    </div>
  );
}

function ProfileContent() {
  const { user, signOut, updateDisplayName, updatePassword } = useAuth();
  const router = useRouter();

  // Stats
  const [stats, setStats] = useState<{ totalNotes: number } | null>(null);
  const [folderCount, setFolderCount] = useState<number | null>(null);
  const [totalViews, setTotalViews] = useState<number | null>(null);

  // Name form
  const [name, setName] = useState(user?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Password form
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    api.getNotesStats().then((s) => setStats({ totalNotes: s.totalNotes })).catch(() => {});
    api.getFolders().then((folders) => {
      setFolderCount(folders.length);
    }).catch(() => {});
    api.getAllNotes().then((notes) => {
      setTotalViews(notes.reduce((sum, n) => sum + (n.viewCount ?? 0), 0));
    }).catch(() => {});
  }, []);

  const handleSaveName = async () => {
    if (!name.trim() || name.trim() === user?.displayName) return;
    setSavingName(true);
    setNameStatus(null);
    try {
      await updateDisplayName(name.trim());
      setNameStatus({ type: "success", msg: "Display name updated successfully." });
    } catch {
      setNameStatus({ type: "error", msg: "Failed to update name. Please try again." });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) return;
    if (newPw !== confirmPw) {
      setPwStatus({ type: "error", msg: "New passwords don't match." });
      return;
    }
    if (newPw.length < 8) {
      setPwStatus({ type: "error", msg: "New password must be at least 8 characters." });
      return;
    }
    setSavingPw(true);
    setPwStatus(null);
    try {
      await updatePassword(oldPw, newPw);
      setPwStatus({ type: "success", msg: "Password changed successfully." });
      setOldPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      setPwStatus({ type: "error", msg });
    } finally {
      setSavingPw(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (!user) return null;

  const initials = user.displayName
    .split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      <Navigation />
      <main className="max-w-2xl mx-auto px-4 py-10 sm:px-6 space-y-5">

        {/* Header card */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-6 py-6 flex items-center gap-5">
          <Avatar className="w-16 h-16 flex-shrink-0">
            <AvatarFallback className="bg-amber-600 text-white text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">{user.displayName}</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs border-amber-400 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 capitalize">
                <Zap className="w-3 h-3 mr-1" />{user.plan} plan
              </Badge>
              {!isCognitoConfigured && (
                <Badge variant="outline" className="text-xs border-gray-300 dark:border-slate-700 text-gray-400 dark:text-slate-500">
                  Dev mode
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ScrollText, label: "Scrolls saved", value: stats?.totalNotes ?? "—" },
            { icon: FolderOpen, label: "Folders", value: folderCount ?? "—" },
            { icon: Eye, label: "Total views", value: totalViews ?? "—" },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4 py-4 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1.5 text-amber-500 dark:text-amber-400" />
              <p className="text-xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Display name */}
        <Section title="Display Name">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/40 transition-colors"
              />
            </div>
            <button
              onClick={handleSaveName}
              disabled={savingName || !name.trim() || name.trim() === user.displayName}
              className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {savingName ? "Saving…" : "Save"}
            </button>
          </div>
          {nameStatus && <StatusMsg {...nameStatus} />}
        </Section>

        {/* Password */}
        <Section title="Change Password">
          {!isCognitoConfigured ? (
            <p className="text-sm text-gray-400 dark:text-slate-500">
              Password changes are not available in dev mode.
            </p>
          ) : (
            <div className="space-y-3">
              {[
                { label: "Current password", value: oldPw, set: setOldPw, placeholder: "Enter current password" },
                { label: "New password", value: newPw, set: setNewPw, placeholder: "At least 8 characters" },
                { label: "Confirm new password", value: confirmPw, set: setConfirmPw, placeholder: "Repeat new password" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
                    <input
                      type="password"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/60 text-sm text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500/40 transition-colors"
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={handleChangePassword}
                disabled={savingPw || !oldPw || !newPw || !confirmPw}
                className="mt-1 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
              >
                {savingPw ? "Updating…" : "Update Password"}
              </button>
              {pwStatus && <StatusMsg {...pwStatus} />}
            </div>
          )}
        </Section>

        {/* Sign out */}
        <div className="rounded-2xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-slate-900/40 px-6 py-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Sign out</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">You can sign back in at any time.</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 dark:border-red-900/40 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
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
