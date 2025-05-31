// react-hono/react/features/kakaologin/ui/SignInPanel.tsx
import React from 'react';
// useAuth 훅을 model에서 직접 가져옵니다.
import { useAuth } from '../model/kakaologin';

export const SignInPanel: React.FC = () => {
  // SignInPanel은 signInAnonymously와 signInWithKakao 함수만 필요로 하므로,
  // 전체 useAuth 훅을 호출하거나, 필요한 함수만 전달받도록 할 수 있습니다.
  // 여기서는 간결성을 위해 useAuth를 호출합니다.
  const { signInAnonymously, signInWithKakao } = useAuth();

  return (
    <div>
      <p>
        Read about and enable{" "}
        <a
          href="https://supabase.com/docs/guides/auth/auth-anonymous"
          target="_blank"
          rel="noopener noreferrer"
        >
          anonymous signins here!
        </a>
      </p>
      <button type="button" onClick={signInAnonymously}>
        Anonymous sign in
      </button>
      <button type="button" onClick={signInWithKakao}>
        Sign in with Kakao
      </button>
    </div>
  );
};