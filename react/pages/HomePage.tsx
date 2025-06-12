// filepath: react-hono/react/pages/HomePage.tsx
import React from "react";

import {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError,
} from "../shared/store/authStore";

import { SignInPanel } from "../features/kakaologin/ui/SignInPanel";
import { SignOutButton } from "../features/kakaologin/ui/SignOutButton";

// import { CountriesSection } from "../features/countriesExample/ui/CountriesSection"; // 이 import 제거
import { UserDetailsButton } from "../widgets/UserDetailsButton";

const HomePage: React.FC = () => {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
  const authError = useAuthStore(selectAuthError);

  if (isLoadingAuth) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>인증 상태를 확인 중입니다...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Hono Supabase Auth Example!</h1>
        {user && <p>환영합니다11, <strong>{user.email || '사용자'}</strong>님!</p>}
      </header>

      <hr style={{ margin: '30px 0' }} />

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px' }}>Sign in / Sign out</h2>
        {!isAuthenticated ? <SignInPanel /> : <SignOutButton />}
        {authError && !isLoadingAuth && (
            <p style={{ color: 'red', marginTop: '10px' }}>
                인증 오류: {authError}
            </p>
        )}
      </section>

      <hr style={{ margin: '30px 0' }} />

      {isAuthenticated && user && (
        <>
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '15px' }}>Example of API fetch() (Hono Client)</h2>
            <UserDetailsButton />
          </section>

        </>
      )}

      {!isAuthenticated && (
        <p style={{ marginTop: '30px', fontStyle: 'italic', textAlign: 'center' }}>
          더 많은 예제를 보거나 데이터를 가져오려면 로그인해주세요.
        </p>
      )}
    </div>
  );
};

export default HomePage;