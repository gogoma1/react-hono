import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProfileSetupForm } from '../entities/profile/ui/ProfileSetupForm';
import { useProfileSetup } from '../entities/profile/model/useProfileSetup';

const queryClient = new QueryClient();

const ProfileSetupContainer: React.FC = () => {
    // [수정] 훅에서 반환하는 모든 props를 그대로 받음
    const profileSetupProps = useProfileSetup();

    // [수정] ref와 나머지 props를 올바르게 전달
    return <ProfileSetupForm ref={profileSetupProps.containerRef} {...profileSetupProps} />;
};


const ProfileSetupPage: React.FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <ProfileSetupContainer />
        </QueryClientProvider>
    );
};

export default ProfileSetupPage;