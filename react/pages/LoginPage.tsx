import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  useAuthStore,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError,
} from '../shared/store/authStore';
import BackgroundBlobs from '../widgets/rootlayout/BackgroundBlobs';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuthGlobal = useAuthStore(selectIsLoadingAuth);
  const authStoreError = useAuthStore(selectAuthError);
  const { signInWithKakao, clearAuthError } = useAuthStore.getState();

  const [isKakaoLoginLoading, setIsKakaoLoginLoading] = useState(false);
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
    } catch (e: any) {
      console.error("Kakao login initiation error in component:", e);
    }
  };

  const displayError = authStoreError || urlErrorMessage;
  const isButtonDisabled = isLoadingAuthGlobal || isKakaoLoginLoading;

  if (isLoadingAuthGlobal && !displayError && !isKakaoLoginLoading) {
    return (
      <div className="login-page-wrapper">
        <div className="login-page-container loading-state">
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
          </div>
          {displayError && (
            <p className="login-error-message">{displayError}</p>
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