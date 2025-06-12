import { Navigate, Outlet } from 'react-router';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore'; // authStore 경로 확인

const ProtectedRoute = () => {
  // 인증 상태를 스토어에서 가져옵니다.
  // isLoadingAuth는 AuthInitializer에서 처리되므로 여기선 단순 인증 여부만 확인해도 됩니다.
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  // 인증되었다면 자식 라우트(Outlet)를 보여주고, 아니면 로그인 페이지로 리디렉션합니다.
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;