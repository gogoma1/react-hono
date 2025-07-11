import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import RootLayout from './widgets/rootlayout/RootLayout';
import ProtectedRoute from './shared/lib/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashBoard from './pages/DashBoard';
import StudentDetailPage from './pages/StudentDetailPage';
import AuthInitializer from './shared/lib/AuthInitializer';
import { useAuthStore, selectIsLoadingAuth } from './shared/store/authStore';
import ProblemWorkbenchPage from './pages/ProblemWorkbenchPage';
// [수정] import 경로와 이름을 변경합니다.
import ProblemSetCreationPage from './pages/ProblemSetCreationPage'; 
import ProblemPublishingPage from './pages/ProblemPublishingPage'; 
import MobileExamPage from './pages/MobileExamPage';
import AccountSettingsModal from './features/account-settings/ui/AccountSettingsModal';
import PublishedExamsPage from './pages/PublishedExamsPage';
import ToastContainer from './widgets/toast-container/ToastContainer'; 
import ExamReportPage from './pages/ExamReportPage'; 

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthInitializer />
            <ToastContainer />
            {isLoadingAuth ? (
                <div className="app-loading-container">
                    <h1>애플리케이션 로딩 중...</h1>
                </div>
            ) : (
                <Router>
                    <AccountSettingsModal />
                    
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/profilesetup" element={<ProfileSetupPage />} />
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RootLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/dashboard" element={<DashBoard />} />
                                <Route path="/problem-workbench" element={<ProblemWorkbenchPage />} />
                                <Route path="/problem-publishing" element={<ProblemPublishingPage />} />
                                
                                {/* [수정] 경로와 element를 새로운 컴포넌트로 변경합니다. */}
                                <Route path="/problem-sets/create" element={<ProblemSetCreationPage />} /> 

                                <Route path="/student/:id" element={<StudentDetailPage />} />
                                
                                <Route path="/mobile-exam" element={<MobileExamPage />} /> 
                                

                                <Route path="/published-exams" element={<PublishedExamsPage />} />
                                <Route path="/exam-report/:assignmentId" element={<ExamReportPage />} />
                                
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