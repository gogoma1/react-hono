// filepath: react-hono/react/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  useAuthStore,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError,
} from '../shared/store/authStore'; // authStore 경로 수정
import BackgroundBlobs from '../widgets/rootlayout/BackgroundBlobs'; // 경로 확인
import './LoginPage.css'; // CSS 파일 경로 확인

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuthGlobal = useAuthStore(selectIsLoadingAuth);
  const authStoreError = useAuthStore(selectAuthError);
  const { signInWithKakao, clearAuthError } = useAuthStore.getState();

  const [isKakaoLoginLoading, setIsKakaoLoginLoading] = useState(false); // 카카오 로그인 버튼 전용 로딩 상태
  const [urlErrorMessage, setUrlErrorMessage] = useState('');

  useEffect(() => {
    if (!isLoadingAuthGlobal && isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuthGlobal, navigate, location.state]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorParam = queryParams.get('error');
    const errorDescriptionParam = queryParams.get('error_description');

    if (errorParam) {
      let message = decodeURIComponent(errorParam);
      if (errorDescriptionParam) {
        message += `: ${decodeURIComponent(errorDescriptionParam)}`;
      }
      setUrlErrorMessage(message);
    }
  }, [location.search]);

  const handleKakaoLogin = async () => {
    if (isKakaoLoginLoading || isLoadingAuthGlobal) return;

    setIsKakaoLoginLoading(true);
    if (authStoreError) clearAuthError();
    setUrlErrorMessage('');

    try {
      await signInWithKakao();
      // 성공 시 OAuth 리다이렉션이 발생하므로, 별도 로딩 해제 코드가 필요 없을 수 있음
      // 에러는 authStore에서 처리
    } catch (e: any) {
      // 일반적으로 signInWithKakao 액션 내부에서 에러를 처리하고 authStoreError에 저장
      console.error("Kakao login initiation error in component:", e);
      // 이 catch는 signInWithKakao가 reject될 경우를 대비 (현재 authStore 구현은 reject하지 않음)
    } finally {
      // signInWithKakao가 에러를 authStore에 기록하면, isLoadingAuthGlobal이 false로 바뀔 때까지
      // 또는 authStoreError가 생길 때까지 버튼은 비활성화/로딩 상태 유지 가능
      // 여기서는 개별 버튼 로딩 상태를 두었으므로, signInWithKakao 호출 후 즉시 해제는 하지 않음
      // OAuth 리다이렉션이 발생하면 이 컴포넌트는 어차피 언마운트되거나 상태가 리셋됨
      // 만약 에러 발생 시 명시적으로 로딩 해제가 필요하면 여기에 추가
      // if (authStoreError) setIsKakaoLoginLoading(false);
    }
  };

  const displayError = authStoreError || urlErrorMessage;
  const isButtonDisabled = isLoadingAuthGlobal || isKakaoLoginLoading;

  if (isLoadingAuthGlobal && !displayError && !isKakaoLoginLoading) {
    return (
      <div className="login-page-wrapper">
        <div className="login-page-container" style={{ textAlign: 'center' }}>
          <p>인증 정보를 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-background-blobs-wrapper">
        <BackgroundBlobs />
      </div>
      <div className="login-page-container">
        <div className="login-form-card">
          <h1 className="login-title">로그인</h1>
          <p className="login-subtitle">소셜 계정으로 간편하게 로그인하고<br />모든 기능을 이용해보세요.</p>
          <div className="social-login-buttons-container">
            <button
              type="button"
              className="social-login-button kakao-login-button"
              onClick={handleKakaoLogin}
              disabled={isButtonDisabled}
              aria-label="카카오 계정으로 로그인"
            >
              <svg className="social-login-icon kakao-icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path d="M9 0C4.029 0 0 3.138 0 7C0 9.039 1.206 10.845 3.108 12.015L2.582 14.956C2.529 15.262 2.811 15.513 3.099 15.37L6.091 13.898C6.683 13.961 7.293 14 7.922 14C12.971 14 17 10.862 17 7C17 3.138 12.971 0 7.922 0C7.922 0 9 0 9 0Z" fill="#000000" />
              </svg>
              <span className="social-login-text">
                {isKakaoLoginLoading || (isLoadingAuthGlobal && !isKakaoLoginLoading) ? '처리 중...' : '카카오 계정으로 로그인'}
              </span>
            </button>
            {/* Google 로그인 버튼 제거됨 */}
          </div>
          {displayError && (
            <p className="login-error-message" style={{ color: 'red', marginTop: '15px' }}>{displayError}</p>
          )}
          <p className="login-terms">
            로그인 시 <a href="/terms" target="_blank" rel="noopener noreferrer">이용약관</a> 및 <a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;