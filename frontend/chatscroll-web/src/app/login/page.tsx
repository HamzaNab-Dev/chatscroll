"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { isCognitoConfigured } from "@/lib/auth-config";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        router.push("/");
      } else {
        await signUp(email, password, displayName);
        if (isCognitoConfigured) {
          setSuccess("Account created! Check your email to verify, then sign in.");
          setMode("signin");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <ScrollText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">ChatScroll</h1>
            <p className="text-sm text-slate-500 mt-1">
              Every question becomes lasting knowledge
            </p>
          </div>
        </div>

        {!isCognitoConfigured && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-amber-400">
              🛠️ Dev mode — any credentials work
            </p>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-5">
          <div className="flex rounded-lg bg-slate-800/60 p-1">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={cn(
                  "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                  mode === m
                    ? "bg-slate-700 text-slate-100 shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {m === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Hamza"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="hamza@example.com"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800/40 rounded-xl px-4 py-2.5">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl px-4 py-2.5">
                <p className="text-xs text-emerald-400">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600">
          Built for the AWS H0 Hackathon · June 2026
        </p>
      </div>
    </main>
  );
}
