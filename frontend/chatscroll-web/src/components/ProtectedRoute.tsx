"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ScrollText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === "unauthenticated") {
      router.push("/login");
    }
  }, [authState.status, router]);

  if (authState.status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
            <ScrollText className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading ChatScroll...</span>
          </div>
        </div>
      </div>
    );
  }

  if (authState.status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
