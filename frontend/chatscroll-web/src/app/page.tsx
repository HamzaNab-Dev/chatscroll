"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollText, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type HealthResponse = {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  environment: string;
};

type ConnectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: HealthResponse }
  | { status: "error"; message: string };

export default function Home() {
  const [connection, setConnection] = useState<ConnectionState>({ status: "idle" });

  const testConnection = async () => {
    setConnection({ status: "loading" });
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";
      const res = await fetch(`${apiUrl}/api/health`, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: HealthResponse = await res.json();
      setConnection({ status: "success", data });
    } catch (err) {
      setConnection({
        status: "error",
        message: err instanceof Error ? err.message : "Connection failed",
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-12 text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
          <ScrollText className="w-10 h-10 text-white" />
        </div>

        {/* Brand */}
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-100 to-orange-200 bg-clip-text text-transparent">
            ChatScroll
          </h1>
          <p className="text-xl text-slate-400 font-light">
            Every question becomes lasting knowledge.
          </p>
        </div>

        {/* Tagline */}
        <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
          Your AI chat assistant that automatically organizes every valuable answer
          into your personal knowledge tree — searchable forever.
        </p>

        {/* Test Connection */}
        <div className="space-y-4 pt-4">
          <Button
            onClick={testConnection}
            size="lg"
            disabled={connection.status === "loading"}
            className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-8"
          >
            {connection.status === "loading" ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              "Test API Connection"
            )}
          </Button>

          {connection.status === "success" && (
            <div className="inline-flex items-start gap-3 px-5 py-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="text-emerald-300 font-medium">
                  Connected to {connection.data.service}
                </p>
                <p className="text-slate-400 text-xs">
                  Version {connection.data.version} • {connection.data.environment}
                </p>
              </div>
            </div>
          )}

          {connection.status === "error" && (
            <div className="inline-flex items-start gap-3 px-5 py-4 rounded-xl bg-red-950/40 border border-red-800/50 text-left">
              <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1 text-sm">
                <p className="text-red-300 font-medium">Connection failed</p>
                <p className="text-slate-400 text-xs">{connection.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-12 text-xs text-slate-600">
          Built for the AWS H0 Hackathon · June 2026
        </div>
      </div>
    </main>
  );
}
