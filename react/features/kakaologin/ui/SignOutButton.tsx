// filepath: react-hono/react/features/kakaologin/ui/SignOutButton.tsx
import React from 'react';
import { useAuthStore } from '../../../shared/store/authStore'; // authStore import

export const SignOutButton: React.FC = () => {
  // authStore에서 signOut 액션과 로딩 상태를 가져옵니다.
  const signOut = useAuthStore(state => state.signOut);
  const isLoadingAuth = useAuthStore(state => state.isLoadingAuth);
  // const user = useAuthStore(state => state.user); // 필요하다면 사용자 정보도 가져올 수 있음

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', marginTop: '10px' }}>
      <h4>로그아웃</h4>
      {/* {user && <p>환영합니다, {user.email || '사용자'}님!</p>} */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isLoadingAuth} // 로딩 중에는 비활성화
        style={{ padding: '8px 12px' }}
      >
        {isLoadingAuth ? '처리 중...' : '로그아웃'}
      </button>
    </div>
  );
};

// export default SignOutButton; // 만약 파일명이 SignOutButton.tsx이고 export const라면 default는 필요 없음