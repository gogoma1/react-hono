// filepath: react-hono/react/shared/store/authStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase'; // 실제 Supabase 클라이언트 인스턴스 경로로 수정해주세요.
import type { User as SupabaseUser, Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

// 앱 전체에서 사용할 User 타입을 여기서 export 합니다.
export type User = SupabaseUser;

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean; // 초기 인증 상태 확인 및 실시간 변경 시 로딩 상태
  authSubscription: Subscription | null; // onAuthStateChange 구독 객체 (클린업용)
  authError: string | null; // 인증 관련 에러 메시지 (선택적)
}

interface AuthActions {
  initializeAuthListener: () => Promise<void>; // 앱 시작 시 인증 리스너 초기화
  clearAuthSubscription: () => void; // 구독 해제
  signInWithKakao: () => Promise<void>; // 카카오 OAuth 로그인
  signOut: () => Promise<void>; // 로그아웃
  clearAuthError: () => void; // 인증 에러 메시지 초기화 (선택적)
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // 초기 상태
  user: null,
  session: null,
  isLoadingAuth: true, // 앱 시작 시 인증 상태를 확인해야 하므로 true로 시작
  authSubscription: null,
  authError: null,

  // 액션 구현
  initializeAuthListener: async () => {
    // 중복 실행 방지: 이미 구독 중이거나, 초기 로딩이 완료되지 않은 상태에서만 실행
    if (get().authSubscription || !get().isLoadingAuth) {
      // console.log('Auth listener already initialized or initial load completed.');
      // 만약 isLoadingAuth가 false인데 authSubscription이 null인 경우 (예: 로그아웃 후)
      // 리스너가 없다면 다시 초기화할 수 있도록 조건 수정 가능.
      // 여기서는 단순 중복 방지를 위해 현재 로직 유지.
      if (get().authSubscription) return;
    }
    // console.log('Initializing auth listener...');
    set({ isLoadingAuth: true, authError: null }); // 리스너 초기화 시작 시 로딩 및 에러 초기화

    try {
      // 1. 초기 세션 확인
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
        // console.log('Initial session loaded in authStore:', initialSession);
      }
    } catch (e: any) {
      console.error('Exception during initial session fetch for authStore:', e);
      set({ user: null, session: null, isLoadingAuth: false, authError: e.message || 'Unknown error during initial session fetch.' });
    }

    // 2. 인증 상태 변경 리스너 설정
    // onAuthStateChange는 구독 객체를 반환합니다.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        // console.log('Supabase auth state change event in authStore:', _event, session);
        // 세션이 변경될 때마다 user와 session 상태 업데이트
        // 로딩 상태는 false로 유지 (초기 로딩 후에는 실시간 변경이므로)
        set({
          user: session?.user ?? null,
          session,
          isLoadingAuth: false, // 실시간 변경이므로 로딩 완료 상태
          authError: null,      // 이벤트 발생 시 이전 에러는 클리어
        });

        // 특정 이벤트에 따른 추가 작업 (선택적)
        // if (_event === 'SIGNED_IN') { console.log('User signed in via authStore listener.'); }
        // if (_event === 'SIGNED_OUT') { console.log('User signed out via authStore listener.'); }
        // if (_event === 'USER_UPDATED') { console.log('User updated via authStore listener.'); }
        // if (_event === 'TOKEN_REFRESHED') { console.log('Token refreshed via authStore listener.'); }
      }
    );

    // 구독 객체 저장 (나중에 해제하기 위함)
    set({ authSubscription: subscription, isLoadingAuth: false }); // 리스너 설정 완료 시 로딩 종료
    // console.log('Auth listener initialized in authStore and subscription set.');
    // Use code with caution.
  },

  clearAuthSubscription: () => {
    const subscription = get().authSubscription;
    if (subscription) {
      subscription.unsubscribe();
      set({ authSubscription: null });
      // console.log('Auth listener unsubscribed from authStore.');
    }
    // Use code with caution.
  },

  signInWithKakao: async () => {
    set({ isLoadingAuth: true, authError: null }); // OAuth 시작 시 로딩 및 에러 초기화
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          // redirectTo는 Supabase 프로젝트 설정의 "Site URL" 및 "Additional Redirect URLs"에 등록되어 있어야 합니다.
          // 일반적으로 앱의 루트나 특정 콜백 처리 페이지로 설정합니다.
          redirectTo: `${window.location.origin}/profilesetup`,
        },
      });
      if (error) {
        console.error('Kakao OAuth error in authStore:', error.message);
        set({ isLoadingAuth: false, authError: error.message });
        // 사용자에게 alert 등으로 알릴 수도 있습니다.
        // alert(`Kakao Sign In Error: ${error.message}`);
      }
      // 성공 시에는 onAuthStateChange 리스너가 SIGNED_IN 이벤트를 감지하고 상태를 업데이트합니다.
      // OAuth는 리다이렉션 후 처리되므로, 여기서 isLoadingAuth를 false로 바로 바꾸지 않을 수 있습니다.
      // 다만, 에러 발생 시에는 false로 설정해주는 것이 좋습니다.
    } catch (e: any) {
      console.error('Exception during Kakao sign in:', e);
      set({ isLoadingAuth: false, authError: e.message || 'Unknown error during Kakao sign in.' });
    }
    // Use code with caution.
  },

  signOut: async () => {
    set({ isLoadingAuth: true, authError: null }); // 로그아웃 시작 시 로딩 및 에러 초기화
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out in authStore:', error.message);
        set({ isLoadingAuth: false, authError: error.message });
      } else {
        // console.log('Signed out successfully via authStore.');
        // onAuthStateChange 리스너가 SIGNED_OUT 이벤트를 감지하고 user/session을 null로, isLoadingAuth를 false로 설정합니다.
        // 명시적으로 상태를 여기서 바로 업데이트 할 수도 있습니다.
        set({ user: null, session: null, isLoadingAuth: false, authError: null });
      }
    } catch (e: any) {
      console.error('Exception during sign out:', e);
      set({ user: null, session: null, isLoadingAuth: false, authError: e.message || 'Unknown error during sign out.' });
    }
    // Use code with caution.
  },

  clearAuthError: () => {
    set({ authError: null });
    // Use code with caution.
  },
}));

// --- 셀렉터 함수들 ---
/**
 * 사용자가 인증되었고, 인증 상태 로딩이 완료되었는지 여부를 반환합니다.
 */
export const selectIsAuthenticated = (state: AuthState): boolean => !state.isLoadingAuth && !!state.user;

/**
 * 단순히 사용자 객체의 존재 여부로 인증 상태를 판단합니다. (로딩 상태 미고려)
 */
export const selectUserExists = (state: AuthState): boolean => !!state.user;

/**
 * 현재 인증 관련 작업(초기 세션 확인, 상태 변경)이 로딩 중인지 여부를 반환합니다.
 */
export const selectIsLoadingAuth = (state: AuthState): boolean => state.isLoadingAuth;

/**
 * 현재 사용자 객체를 반환합니다. 인증되지 않았거나 로딩 중이면 null일 수 있습니다.
 */
export const selectUser = (state: AuthState): User | null => state.user;

/**
 * 현재 세션 객체를 반환합니다. 인증되지 않았거나 로딩 중이면 null일 수 있습니다.
 */
export const selectSession = (state: AuthState): Session | null => state.session;

/**
 * 현재 인증 관련 에러 메시지를 반환합니다. 에러가 없으면 null입니다.
 */
export const selectAuthError = (state: AuthState): string | null => state.authError;