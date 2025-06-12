// filepath: react-hono/react/shared/lib/AuthInitializer.tsx

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthInitializer: React.FC = () => {
  const initializeAuth = useAuthStore.getState().initializeAuthListener;

  useEffect(() => {
    // 앱이 시작될 때 단 한 번만 인증 리스너를 설정하는 역할을 합니다.
    initializeAuth();

    // ★★★ return 문 (정리 함수)을 반드시 제거해야 합니다. ★★★
    // StrictMode에서 컴포넌트가 언마운트/리마운트 될 때
    // 앱 전체에서 유지되어야 할 리스너 구독을 해제하면 안 됩니다.
    
  }, [initializeAuth]); // 의존성 배열은 안정성을 위해 유지합니다.

  // 이 컴포넌트는 UI를 렌더링하지 않습니다.
  return null; 
};

export default AuthInitializer;