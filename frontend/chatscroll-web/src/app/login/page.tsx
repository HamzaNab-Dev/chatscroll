"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScrollText, Eye, EyeOff, Loader2, Mail, Sun, Moon, ArrowLeft } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { isCognitoConfigured } from "@/lib/auth-config";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup" | "verify";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, confirmSignUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Open on Sign Up tab when navigated from "Start for Free" / "Create Free Account"
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
  }, []);

  // Password strength
  const passwordRequirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter (A–Z)", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a–z)", met: /[a-z]/.test(password) },
    { label: "One number (0–9)", met: /[0-9]/.test(password) },
    { label: "One special character (!@#$…)", met: /[^a-zA-Z0-9]/.test(password) },
  ];
  const strengthCount = passwordRequirements.filter((r) => r.met).length;
  const strengthLabel = strengthCount <= 1 ? "Weak" : strengthCount <= 2 ? "Fair" : strengthCount <= 3 ? "Good" : strengthCount === 4 ? "Strong" : "Very Strong";
  const strengthBarColor = strengthCount <= 1 ? "bg-red-500" : strengthCount <= 2 ? "bg-orange-400" : strengthCount <= 3 ? "bg-amber-400" : "bg-emerald-500";
  const strengthTextColor = strengthCount <= 1 ? "text-red-500" : strengthCount <= 2 ? "text-orange-400" : strengthCount <= 3 ? "text-amber-500" : "text-emerald-500";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
        try { sessionStorage.setItem("cs_force_new", "1"); } catch {}
        router.push("/chat");

      } else if (mode === "signup") {
        await signUp(email, password, displayName);
        if (isCognitoConfigured) {
          setMode("verify");
          setSuccess(`Verification code sent to ${email}`);
        } else {
          try { sessionStorage.setItem("cs_force_new", "1"); } catch {}
          router.push("/chat");
        }

      } else if (mode === "verify") {
        await confirmSignUp(email, verifyCode.trim());
        setSuccess("Email verified! You can now sign in.");
        setVerifyCode("");
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center px-4 relative">
      {/* Back to home — top left */}
      <Link
        href="/"
        className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors px-2.5 py-1.5 rounded-lg"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Home
      </Link>

      {/* Theme toggle — top right */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
            <ScrollText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">ChatScroll</h1>
            <p className="text-sm text-gray-500 dark:text-slate-500 mt-1">
              Every question becomes lasting knowledge
            </p>
          </div>
        </div>

        {!isCognitoConfigured && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              🛠️ Dev mode — any credentials work
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm dark:shadow-none">
          {mode !== "verify" && (
            <div className="flex rounded-lg bg-gray-100 dark:bg-slate-800/60 p-1">
              {(["signin", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                  className={cn(
                    "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                    mode === m
                      ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 shadow-sm"
                      : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                  )}
                >
                  {m === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {mode === "verify" && (
            <div className="flex items-center gap-3 pb-1">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/40 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-slate-200">Check your email</p>
                <p className="text-xs text-gray-500 dark:text-slate-500">Enter the 6-digit code sent to {email}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "verify" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50 tracking-[0.3em] text-center font-mono text-base"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
            ) : (
              <>
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 dark:text-slate-400">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="your@email.com"
                    className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 dark:text-slate-400">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 dark:bg-slate-800/60 border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-600 focus:outline-none focus:border-amber-500 dark:focus:border-amber-500/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength — only shown in signup mode once user starts typing */}
                  {mode === "signup" && password.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {/* Strength bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 flex gap-1">
                          {passwordRequirements.map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-1 flex-1 rounded-full transition-colors duration-200",
                                i < strengthCount ? strengthBarColor : "bg-gray-200 dark:bg-slate-700"
                              )}
                            />
                          ))}
                        </div>
                        <span className={cn("text-xs font-semibold min-w-[56px] text-right", strengthTextColor)}>
                          {strengthLabel}
                        </span>
                      </div>
                      {/* Requirements checklist */}
                      <div className="space-y-1">
                        {passwordRequirements.map((req) => (
                          <div key={req.label} className="flex items-center gap-1.5">
                            {req.met ? (
                              <span className="text-emerald-500 text-xs leading-none">✓</span>
                            ) : (
                              <span className="text-gray-400 dark:text-slate-600 text-xs leading-none font-bold">+</span>
                            )}
                            <span className={cn(
                              "text-xs",
                              req.met
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-gray-400 dark:text-slate-500"
                            )}>
                              {req.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-2.5">
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-4 py-2.5">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">{success}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || (mode === "verify" && verifyCode.length !== 6)}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 rounded-xl"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : mode === "signup" ? (
                "Create Account"
              ) : (
                "Verify Email"
              )}
            </Button>

            {mode === "verify" && (
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
                className="w-full text-xs text-gray-400 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-400 transition-colors"
              >
                ← Back to sign up
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-slate-600">
          Built for the AWS H0 Hackathon · June 2026
        </p>
      </div>
    </main>
  );
}
