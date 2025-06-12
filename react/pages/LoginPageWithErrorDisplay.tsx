// filepath: react-hono/react/pages/LoginPageWithErrorDisplay.tsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router'; // react-router-dom 훅 사용
import { useAuthStore, selectAuthError, selectIsAuthenticated, selectIsLoadingAuth } from '../shared/store/authStore';

const LoginPageWithErrorDisplay: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // URL 쿼리 파라미터에서 에러 정보 가져오기
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlErrorDescription, setUrlErrorDescription] = useState<string | null>(null);

  // authStore의 에러 및 인증 상태
  const authStoreError = useAuthStore(selectAuthError);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
  const clearAuthStoreError = useAuthStore.getState().clearAuthError; // 에러 클리어 액션

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const errorDescriptionParam = params.get('error_description');

    if (errorParam) {
      setUrlError(decodeURIComponent(errorParam));
    }
    if (errorDescriptionParam) {
      setUrlErrorDescription(decodeURIComponent(errorDescriptionParam));
    }

    // 이 페이지에 진입했다는 것은 OAuth 리다이렉션 후일 가능성이 높으므로,
    // authStore에 에러가 있다면 한 번 보여주고 클리어하는 것이 좋을 수 있습니다.
    // 또는, URL 에러만 표시하고 authStore 에러는 다른 곳에서 처리할 수도 있습니다.
    // return () => {
    //   if (authStoreError) {
    //     clearAuthStoreError();
    //   }
    // };
  }, [location.search /*, authStoreError, clearAuthStoreError */]);


  // 만약 로딩이 완료되었고 이미 인증된 상태라면, 홈페이지 등으로 리다이렉트
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      // console.log('Already authenticated, redirecting from login page...');
      navigate('/'); // 또는 이전 페이지나 대시보드로 리다이렉트
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);


  const handleRetryLogin = () => {
    // authStore에 있는 signInWithKakao를 사용하거나,
    // 직접 Supabase 로그인 로직을 호출할 수 있습니다.
    // 여기서는 TestAuthPage로 보내서 다시 시도하도록 유도합니다.
    // 혹은, 이전 페이지로 돌아가게 할 수도 있습니다.
    navigate('/test-auth'); // 또는 로그인 시도 페이지
  };

  // 최종적으로 표시할 에러 메시지 결정
  const displayError = urlError || authStoreError;
  const displayErrorDescription = urlErrorDescription;


  // 아직 인증 상태 로딩 중이면 간단한 로딩 메시지 표시
  if (isLoadingAuth) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>인증 상태를 확인 중입니다...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '40px auto', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
      <h1>로그인</h1>

      {displayError && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '15px', margin: '20px 0', borderRadius: '4px' }}>
          <h2>로그인 오류</h2>
          <p><strong>오류 코드:</strong> {displayError}</p>
          {displayErrorDescription && <p><strong>상세 정보:</strong> {displayErrorDescription}</p>}
          <p>로그인 과정에서 문제가 발생했습니다.</p>
        </div>
      )}

      {!displayError && !isAuthenticated && (
        <p style={{ margin: '20px 0' }}>
          로그인이 필요한 서비스입니다.
        </p>
      )}

      {/* 사용자가 이미 로그인되어 있다면 이 페이지를 볼 이유가 별로 없음 */}
      {/* isAuthenticated 상태에 따라 다른 UI를 보여줄 수도 있음 */}

      <div style={{ marginTop: '30px' }}>
        <button
          onClick={handleRetryLogin}
          style={{ padding: '10px 20px', marginRight: '10px', cursor: 'pointer' }}
        >
          로그인 페이지로 돌아가기
        </button>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button style={{ padding: '10px 20px', cursor: 'pointer' }}>
            홈으로 이동
          </button>
        </Link>
      </div>

      {/* authStore의 에러를 명시적으로 클리어하고 싶다면 버튼 추가 가능
      {authStoreError && (
        <button onClick={clearAuthStoreError} style={{ marginTop: '10px' }}>
          스토어 에러 메시지 지우기
        </button>
      )}
      */}
    </div>
  );
};

export default LoginPageWithErrorDisplay;