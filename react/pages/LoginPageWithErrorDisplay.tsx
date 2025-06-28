import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuthStore, selectAuthError, selectIsAuthenticated, selectIsLoadingAuth } from '../shared/store/authStore';
import './LoginPageWithErrorDisplay.css';

const LoginPageWithErrorDisplay: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlErrorDescription, setUrlErrorDescription] = useState<string | null>(null);

  const authStoreError = useAuthStore(selectAuthError);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const errorDescriptionParam = params.get('error_description');

    if (errorParam) setUrlError(decodeURIComponent(errorParam));
    if (errorDescriptionParam) setUrlErrorDescription(decodeURIComponent(errorDescriptionParam));
  }, [location.search]);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/');
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);

  const handleRetryLogin = () => {
    navigate('/login');
  };

  const displayError = urlError || authStoreError;
  const displayErrorDescription = urlErrorDescription;

  if (isLoadingAuth) {
    return (
      <div className="login-error-page loading">
        <p>인증 상태를 확인 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="login-error-page">
      <div className="error-card">
        <h1>로그인</h1>
        {displayError && (
          <div className="error-details">
            <h2>로그인 오류</h2>
            <p><strong>오류 코드:</strong> {displayError}</p>
            {displayErrorDescription && <p><strong>상세 정보:</strong> {displayErrorDescription}</p>}
            <p>로그인 과정에서 문제가 발생했습니다.</p>
          </div>
        )}

        {!displayError && !isAuthenticated && (
          <p className="login-needed-message">
            로그인이 필요한 서비스입니다.
          </p>
        )}

        <div className="action-buttons">
          <button onClick={handleRetryLogin} className="action-button retry-button">
            로그인 페이지로 돌아가기
          </button>
          <Link to="/" className="action-button-link">
            <button className="action-button home-button">
              홈으로 이동
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPageWithErrorDisplay;