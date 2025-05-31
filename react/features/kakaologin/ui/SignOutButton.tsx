// react-hono/react/features/kakaologin/ui/SignOutButton.tsx
import React from 'react';
import { useAuth } from '../model/kakaologin';

export const SignOutButton: React.FC = () => {
  const { signOut } = useAuth(); // signOut 함수만 필요

  const handleSignOut = async () => {
    await signOut();
    // 필요시 /signout 엔드포인트로 리다이렉트
    // if (your_server_has_signout_endpoint) window.location.href = "/signout";
  };

  return (
    <button type="button" onClick={handleSignOut}>
      Sign out!
    </button>
  );
};