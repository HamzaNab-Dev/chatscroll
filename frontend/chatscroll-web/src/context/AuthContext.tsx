"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { isCognitoConfigured } from "@/lib/auth-config";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  plan: "free" | "pro" | "business";
  token?: string;
};

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated" };

type AuthContextType = {
  authState: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

const DEV_USER: AuthUser = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "dev@chatscroll.local",
  displayName: "Dev User",
  plan: "pro",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    if (!isCognitoConfigured) {
      setAuthState({ status: "authenticated", user: DEV_USER });
      return;
    }

    try {
      const storedUser = localStorage.getItem("chatscroll_user");
      if (storedUser) {
        const user = JSON.parse(storedUser) as AuthUser;
        setAuthState({ status: "authenticated", user });
      } else {
        setAuthState({ status: "unauthenticated" });
      }
    } catch {
      setAuthState({ status: "unauthenticated" });
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isCognitoConfigured) {
      const user: AuthUser = {
        ...DEV_USER,
        email,
        displayName: email.split("@")[0],
      };
      localStorage.setItem("chatscroll_user", JSON.stringify(user));
      setAuthState({ status: "authenticated", user });
      return;
    }

    // Phase 6: integrate aws-amplify v6 Cognito sign-in here
    // import { signIn } from 'aws-amplify/auth';
    // const result = await signIn({ username: email, password });
    throw new Error("Cognito sign-in: configure AWS_COGNITO_* env vars and integrate aws-amplify in Phase 6");
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isCognitoConfigured) {
      const user: AuthUser = {
        ...DEV_USER,
        email,
        displayName,
      };
      localStorage.setItem("chatscroll_user", JSON.stringify(user));
      setAuthState({ status: "authenticated", user });
      return;
    }

    // Phase 6: integrate aws-amplify v6 Cognito sign-up here
    // import { signUp } from 'aws-amplify/auth';
    // await signUp({ username: email, password, options: { userAttributes: { email, name: displayName } } });
    throw new Error("Cognito sign-up: configure AWS_COGNITO_* env vars and integrate aws-amplify in Phase 6");
  };

  const signOut = async () => {
    localStorage.removeItem("chatscroll_user");

    if (!isCognitoConfigured) {
      setAuthState({ status: "unauthenticated" });
      return;
    }

    // Phase 6: integrate aws-amplify v6 Cognito sign-out here
    // import { signOut } from 'aws-amplify/auth';
    // await signOut();
    setAuthState({ status: "unauthenticated" });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        signIn,
        signUp,
        signOut,
        isAuthenticated: authState.status === "authenticated",
        user: authState.status === "authenticated" ? authState.user : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
