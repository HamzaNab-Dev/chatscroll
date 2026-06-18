"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LandingWithChat } from "@/components/LandingWithChat";

export default function Home() {
  const { authState } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (authState.status === "authenticated") {
      router.push("/chat");
    }
  }, [authState.status, router]);

  if (authState.status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (authState.status === "unauthenticated") {
    return <LandingWithChat />;
  }

  return null;
}
