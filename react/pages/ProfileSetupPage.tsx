import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileSetupForm } from '../entities/profile/ui/ProfileSetupForm';

// React Query 클라이언트를 생성합니다.
const queryClient = new QueryClient();

/**
 * 프로필 설정 페이지
 * 이 페이지는 데이터 fetching을 위한 QueryClientProvider와
 * 실제 UI를 담당하는 ProfileSetupForm을 조립하는 역할만 수행합니다.
 */
const ProfileSetupPage: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ProfileSetupForm />
        </QueryClientProvider>
    );
};

export default ProfileSetupPage;