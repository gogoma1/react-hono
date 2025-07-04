import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

export type User = SupabaseUser;

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean;
  authSubscription: Subscription | null;
  authError: string | null;
}

interface AuthActions {
  initializeAuthListener: () => Promise<void>;
  clearAuthSubscription: () => void;
  signInWithKakao: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithAnotherAccount: () => Promise<void>; // [신규] 다른 계정으로 로그인 액션
  clearAuthError: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  session: null,
  isLoadingAuth: true,
  authSubscription: null,
  authError: null,

  initializeAuthListener: async () => {
    if (get().authSubscription || !get().isLoadingAuth) {
      if (get().authSubscription) return;
    }
    set({ isLoadingAuth: true, authError: null });

    try {
      const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession();

      if (initialError) {
        console.error('Error getting initial session for authStore:', initialError.message);
        set({ user: null, session: null, isLoadingAuth: false, authError: initialError.message });
      } else {
        set({
          user: initialSession?.user ?? null,
          session: initialSession,
          isLoadingAuth: false,
          authError: null,
        });
      }
    } catch (e: any) {
      console.error('Exception during initial session fetch for authStore:', e);
      set({ user: null, session: null, isLoadingAuth: false, authError: e.message || 'Unknown error during initial session fetch.' });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        set({
          user: session?.user ?? null,
          session,
          isLoadingAuth: false,
          authError: null,
        });
      }
    );

    set({ authSubscription: subscription, isLoadingAuth: false });
  },

  clearAuthSubscription: () => {
    const subscription = get().authSubscription;
    if (subscription) {
      subscription.unsubscribe();
      set({ authSubscription: null });
    }
  },

  signInWithKakao: async () => {
    set({ isLoadingAuth: true, authError: null });
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/profilesetup`,
        },
      });
      if (error) {
        console.error('Kakao OAuth error in authStore:', error.message);
        set({ isLoadingAuth: false, authError: error.message });
      }
    } catch (e: any) {
      console.error('Exception during Kakao sign in:', e);
      set({ isLoadingAuth: false, authError: e.message || 'Unknown error during Kakao sign in.' });
    }
  },
  
  // --- [신규] 다른 계정으로 로그인하는 액션 ---
  signInWithAnotherAccount: async () => {
    set({ isLoadingAuth: true, authError: null });
    try {
        // 1. 먼저 현재 앱의 세션에서 로그아웃합니다.
        await supabase.auth.signOut();
        
        // 2. 카카오 로그인을 다시 요청합니다. 
        // `prompt=login` 파라미터는 카카오 측에 "사용자에게 계정 선택 창을 다시 보여달라"고 요청하는 표준 OAuth 파라미터입니다.
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: `${window.location.origin}/profilesetup`,
                queryParams: {
                    prompt: 'login',
                }
            },
        });

        if (error) {
            console.error('Kakao OAuth (another account) error:', error.message);
            set({ isLoadingAuth: false, authError: error.message });
        }
    } catch (e: any) {
        console.error('Exception during sign-in with another account:', e);
        set({ isLoadingAuth: false, authError: e.message || 'Unknown error.' });
    }
  },

  signOut: async () => {
    set({ isLoadingAuth: true, authError: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out in authStore:', error.message);
        set({ isLoadingAuth: false, authError: error.message });
      } else {
        set({ user: null, session: null, isLoadingAuth: false, authError: null });
      }
    } catch (e: any) {
      console.error('Exception during sign out:', e);
      set({ user: null, session: null, isLoadingAuth: false, authError: e.message || 'Unknown error during sign out.' });
    }
  },

  clearAuthError: () => {
    set({ authError: null });
  },
}));

export const selectIsAuthenticated = (state: AuthState): boolean => !state.isLoadingAuth && !!state.user;
export const selectUserExists = (state: AuthState): boolean => !!state.user;
export const selectIsLoadingAuth = (state: AuthState): boolean => state.isLoadingAuth;
export const selectUser = (state: AuthState): User | null => state.user;
export const selectSession = (state: AuthState): Session | null => state.session;
export const selectAuthError = (state: AuthState): string | null => state.authError;