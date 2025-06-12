import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

import RootLayout from './widgets/rootlayout/RootLayout';
import ProtectedRoute from './shared/lib/ProtectedRoute';
import HomePage from './pages/HomePage';
import ExamplePage from './pages/example';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashBoard from './pages/DashBoard';
// [FSD] 신규 페이지 import
import StudentDetailPage from './pages/StudentDetailPage';
import AuthInitializer from './shared/lib/AuthInitializer';
import { useAuthStore, selectIsLoadingAuth } from './shared/store/authStore';

const queryClient = new QueryClient();

function App() {
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthInitializer />
            {isLoadingAuth ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <h1>애플리케이션 로딩 중...</h1>
                </div>
            ) : (
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/profilesetup" element={<ProfileSetupPage />} />
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RootLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/dashboard" element={<DashBoard />} />
                                <Route path="/exampleget" element={<ExamplePage />} />
                                {/* [FSD] 학생 상세 페이지 라우트 추가 */}
                                <Route path="/student/:id" element={<StudentDetailPage />} />
                            </Route>
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            )}
        </QueryClientProvider>
    );
}

export default App;