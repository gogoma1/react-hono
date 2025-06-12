// filepath: react-hono/react/features/kakaologin/ui/SignInPanel.tsx
import React from 'react';
import { useAuthStore } from '../../../shared/store/authStore'; // authStore import

export const SignInPanel: React.FC = () => {
  // authStore에서 signInWithKakao 액션과 로딩 상태를 가져옵니다.
  const signInWithKakao = useAuthStore(state => state.signInWithKakao);
  const isLoadingAuth = useAuthStore(state => state.isLoadingAuth);
  const authError = useAuthStore(state => state.authError);
  const clearAuthError = useAuthStore.getState().clearAuthError;


  const handleSignIn = async () => {
    if (authError) { // 이전 에러가 있다면 클리어
      clearAuthError();
    }
    await signInWithKakao();
  };



  return (
    <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', marginTop: '10px' }}>
      <h4>로그인</h4>
      <p>
        아직 로그인하지 않으셨습니다. <br/>
        아래 버튼을 통해 카카오 계정으로 로그인할 수 있습니다.
      </p>
      <button
        type="button"
        onClick={handleSignIn}
        style={{ padding: '8px 12px' }}
        disabled={isLoadingAuth} // 로딩 중에는 비활성화
      >
        {isLoadingAuth ? '처리 중...' : '카카오 계정으로 로그인 (Supabase SDK)'}
      </button>
      {/* authError를 여기서 직접 보여줄 수도 있습니다. */}
      {authError && !isLoadingAuth && ( // 로딩 중이 아닐 때만 에러 표시
        <p style={{ color: 'red', marginTop: '10px' }}>
          로그인 오류: {authError}
        </p>
      )}
    </div>
  );
};

// export default SignInPanel; // 만약 파일명이 SignInPanel.tsx이고 export const라면 default는 필요 없음