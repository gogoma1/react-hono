import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ProfileSetupForm } from '../entities/profile/ui/ProfileSetupForm';
import { useProfileSetup } from '../entities/profile/model/useProfileSetup';
import { useProfileExistsQuery, useMyProfileQuery } from '../entities/profile/model/useProfileQuery';

const queryClient = new QueryClient();

// 역할에 따라 리디렉션하는 로직을 담은 컴포넌트
const RoleBasedRedirector: React.FC = () => {
    const navigate = useNavigate();
    const { data: profile, isLoading, isError } = useMyProfileQuery();

    useEffect(() => {
        if (isLoading) return; // 프로필 로딩 중이면 대기

        if (isError || !profile || !profile.roles || profile.roles.length === 0) {
            // 프로필을 못불러오거나 역할이 없으면 안전하게 대시보드로 보냄
            // 이 경우는 거의 없지만, 예외 상황에 대한 대비
            navigate('/dashboard', { replace: true });
            return;
        }

        const isStudent = profile.roles.some(r => r.name === '학생');
        if (isStudent) {
            navigate('/mobile-exam', { replace: true });
        } else {
            navigate('/dashboard', { replace: true });
        }
    }, [profile, isLoading, isError, navigate]);

    // 리디렉션이 실행되기 전까지 로딩 상태를 표시
    return (
        <div className="profile-setup-page-wrapper loading">
            <h1>프로필 확인 중...</h1>
            <p>잠시 후 역할에 맞는 페이지로 이동합니다.</p>
        </div>
    );
};


const ProfileSetupContainer: React.FC = () => {
    const { data: profileExistsData, isLoading, isError } = useProfileExistsQuery();
    const profileSetupProps = useProfileSetup();
    
    if (isLoading) {
        return (
            <div className="profile-setup-page-wrapper loading">
                <h1>프로필 정보 확인 중...</h1>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="profile-setup-page-wrapper loading">
                <h1>오류가 발생했습니다. 새로고침 해주세요.</h1>
            </div>
        );
    }

    // [핵심 로직]
    if (profileExistsData?.exists) {
        // 프로필이 이미 존재하면 역할 기반 리디렉션을 수행
        return <RoleBasedRedirector />;
    }

    // 프로필이 없으면 설정 폼을 렌더링
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