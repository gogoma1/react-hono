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
import { UserDetailsButton } from "../widgets/UserDetailsButton";
import './HomePage.css';

const HomePage: React.FC = () => {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
  const authError = useAuthStore(selectAuthError);

  if (isLoadingAuth) {
    return (
      <div className="homepage-container homepage-loading">
        <h2>인증 상태를 확인 중입니다...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    );
  }

  return (
    <div className="homepage-container">
      <header className="homepage-header">
        <h1>Hono Supabase Auth Example!</h1>
        {user && <p>환영합니다, <strong>{user.email || '사용자'}</strong>님!</p>}
      </header>

      <hr className="homepage-divider" />

      <section className="homepage-section">
        <h2 className="section-title">Sign in / Sign out</h2>
        {!isAuthenticated ? <SignInPanel /> : <SignOutButton />}
        {authError && !isLoadingAuth && (
            <p className="auth-error-message">
                인증 오류: {authError}
            </p>
        )}
      </section>

      <hr className="homepage-divider" />

      {isAuthenticated && user && (
        <>
          <section className="homepage-section">
            <h2 className="section-title">Example of API fetch() (Hono Client)</h2>
            <UserDetailsButton />
          </section>
        </>
      )}

      {!isAuthenticated && (
        <p className="login-prompt">
          더 많은 예제를 보거나 데이터를 가져오려면 로그인해주세요.
        </p>
      )}
    </div>
  );
};

export default HomePage;