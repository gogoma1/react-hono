// react-hono/react/features/kakaologin/model/kakaologin.tsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../../shared/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js"; // Supabase의 User 타입

// 앱 전체에서 사용할 User 타입을 여기서 export 할 수 있습니다.
export type User = SupabaseUser;

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export interface AuthActions {
  signInWithKakao: () => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface UseAuthReturn extends AuthState, AuthActions {}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signInWithKakao = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error("Kakao OAuth error:", error.message);
      alert(`Kakao Sign In Error: ${error.message}`);
    }
  }, []);

  const signInAnonymously = useCallback(async () => {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Error signing in anonymously:", error.message);
      alert(`Anonymous Sign In Error: ${error.message}`);
    } else {
      console.log("Signed in anonymously! User id: " + data?.user?.id);
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error.message);
      alert(`Sign Out Error: ${error.message}`);
    } else {
      console.log("Signed out!");
      // 서버측에서 쿠키를 지우는 /signout 엔드포인트가 있다면 호출
      // window.location.href = "/signout";
    }
  }, []);

  return { user, isLoading, signInWithKakao, signInAnonymously, signOut };
}