import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { buildAuthCallbackUrl } from "../utils/routeIntents";

type SignInWithMagicLink = (email: string, redirectTo?: string) => Promise<void>;

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: SignInWithMagicLink;
  signOut: () => Promise<void>;
}

const signInWithMagicLinkUnavailable: SignInWithMagicLink = async () => {};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: false,
  signInWithMagicLink: signInWithMagicLinkUnavailable,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) {
          return;
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithMagicLink: SignInWithMagicLink = async (email, redirectTo) => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(redirectTo),
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return (
    <Ctx.Provider
      value={{
        user,
        session,
        loading,
        signInWithMagicLink,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(Ctx);
