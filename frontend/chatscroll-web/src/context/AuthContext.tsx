"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { Amplify } from "aws-amplify";
import {
  signIn as amplifySignIn,
  signUp as amplifySignUp,
  confirmSignUp as amplifyConfirmSignUp,
  signOut as amplifySignOut,
  getCurrentUser,
  fetchAuthSession,
  updateUserAttributes,
  updatePassword as amplifyUpdatePassword,
} from "aws-amplify/auth";
import { isCognitoConfigured, cognitoConfig } from "@/lib/auth-config";

// Configure Amplify once on the client when Cognito is available
if (typeof window !== "undefined" && isCognitoConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: cognitoConfig.userPoolId,
        userPoolClientId: cognitoConfig.userPoolClientId,
      },
    },
  });
}

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
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
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

    // Restore an existing Amplify/Cognito session on page load
    const restore = async () => {
      try {
        const { userId } = await getCurrentUser();
        const session = await fetchAuthSession();
        const idToken = session.tokens?.idToken;
        const payload = idToken?.payload ?? {};
        const user: AuthUser = {
          id: userId,
          email: String(payload["email"] ?? ""),
          displayName: String(
            payload["name"] ?? String(payload["email"] ?? "").split("@")[0]
          ),
          plan: "free",
          token: idToken?.toString(),
        };
        setAuthState({ status: "authenticated", user });
      } catch {
        setAuthState({ status: "unauthenticated" });
      }
    };

    restore();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isCognitoConfigured) {
      const user: AuthUser = {
        ...DEV_USER,
        email,
        displayName: email.split("@")[0],
      };
      setAuthState({ status: "authenticated", user });
      return;
    }

    const { nextStep } = await amplifySignIn({ username: email, password });

    if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
      throw new Error(
        "Please verify your email first. Check your inbox for the confirmation code."
      );
    }
    if (nextStep.signInStep !== "DONE") {
      throw new Error(`Unexpected sign-in step: ${nextStep.signInStep}`);
    }

    const { userId } = await getCurrentUser();
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;
    const payload = idToken?.payload ?? {};
    const user: AuthUser = {
      id: userId,
      email: String(payload["email"] ?? email),
      displayName: String(
        payload["name"] ?? String(payload["email"] ?? email).split("@")[0]
      ),
      plan: "free",
      token: idToken?.toString(),
    };
    setAuthState({ status: "authenticated", user });
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    if (!isCognitoConfigured) {
      const user: AuthUser = { ...DEV_USER, email, displayName };
      setAuthState({ status: "authenticated", user });
      return;
    }

    await amplifySignUp({
      username: email,
      password,
      options: {
        userAttributes: { email, name: displayName },
      },
    });
    // Cognito sends a 6-digit code to the user's email.
    // Caller should now prompt for that code and call confirmSignUp.
  };

  const confirmSignUp = async (email: string, code: string) => {
    await amplifyConfirmSignUp({ username: email, confirmationCode: code });
  };

  const signOut = async () => {
    if (isCognitoConfigured) {
      await amplifySignOut();
    }
    setAuthState({ status: "unauthenticated" });
  };

  const updateDisplayName = async (name: string) => {
    if (isCognitoConfigured) {
      await updateUserAttributes({ userAttributes: { name } });
    }
    setAuthState((prev) =>
      prev.status === "authenticated"
        ? { ...prev, user: { ...prev.user, displayName: name } }
        : prev
    );
  };

  const updatePassword = async (oldPassword: string, newPassword: string) => {
    if (!isCognitoConfigured) {
      throw new Error("Password changes are not available in dev mode.");
    }
    await amplifyUpdatePassword({ oldPassword, newPassword });
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        signIn,
        signUp,
        confirmSignUp,
        signOut,
        updateDisplayName,
        updatePassword,
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
