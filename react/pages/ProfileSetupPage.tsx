// filepath: react-hono/react/pages/ProfileSetupPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod'; // 프론트엔드 유효성 검사를 위해 import
import { useAuthStore, selectUser, selectIsLoadingAuth } from '../shared/store/authStore';
import BackgroundBlobs from '../widgets/rootlayout/BackgroundBlobs';
import './ProfileSetupPage.css';

// --- 상수 및 타입, 스키마 정의 ---
const POSITIONS = ['학생', '원장', '강사', '학부모'] as const;
type PositionType = typeof POSITIONS[number];

// Zod를 사용하여 폼 데이터의 유효성 검사 스키마를 정의합니다.
// 백엔드 API의 유효성 검사 스키마와 일치시키는 것이 좋습니다.
const profileFormSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  position: z.enum(POSITIONS, { 
    errorMap: () => ({ message: "직급을 선택해주세요." }) 
  }),
  academyName: z.string().min(1, "학원 이름은 필수 항목입니다.").max(150),
  region: z.string().min(1, "지역은 필수 항목입니다.").max(100),
});
type ProfileFormSchema = z.infer<typeof profileFormSchema>;

// --- 메인 컴포넌트 ---
const ProfileSetupPage: React.FC = () => {
    const navigate = useNavigate();

    // 1. authStore에서 전역 인증 상태를 가져옵니다.
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
    const user = useAuthStore(selectUser);

    // 2. 이 페이지에서만 사용하는 로컬 상태들을 정의합니다.
    const [isCheckingProfile, setIsCheckingProfile] = useState(true); // 프로필 확인 API 로딩 상태
    const [isSubmitting, setIsSubmitting] = useState(false); // 폼 제출 API 로딩 상태
    
    // 폼 입력 필드 상태
    const [name, setName] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<PositionType | ''>('');
    const [academyName, setAcademyName] = useState('');
    const [region, setRegion] = useState('');

    // 에러 메시지 상태
    const [formErrors, setFormErrors] = useState<z.ZodFormattedError<ProfileFormSchema> | null>(null);
    const [apiErrorMessage, setApiErrorMessage] = useState('');

    // ★★★ 핵심 로직: 페이지 진입 시 프로필 확인 및 분기 처리 ★★★
    useEffect(() => {
        // 인증 로딩이 끝나고, 사용자가 존재하는 것이 확실할 때만 프로필 확인을 시작합니다.
        if (!isLoadingAuth && user) {
            const checkProfile = async () => {
                try {
                    const response = await fetch('/api/profiles/exists');
                    if (!response.ok) throw new Error(`API Error: ${response.status}`);
                    
                    const data = await response.json();

                    if (data.exists) {
                        // 프로필이 있으면 대시보드로 리디렉션합니다.
                        navigate('/', { replace: true });
                    } else {
                        // 프로필이 없으면 로딩을 끝내고 폼을 보여줄 준비를 합니다.
                        setName(user.user_metadata?.name || ''); // 이름 기본값 설정
                        setIsCheckingProfile(false);
                    }
                } catch (error) {
                    console.error('Failed to check profile:', error);
                    setApiErrorMessage('프로필 확인 중 오류가 발생했습니다. 새로고침 해주세요.');
                    setIsCheckingProfile(false);
                }
            };
            checkProfile();
        } else if (!isLoadingAuth && !user) {
            // 로딩이 끝났는데 사용자가 없는 예외적인 경우, 로그인 페이지로 보냅니다.
            navigate('/login', { replace: true });
        }
    }, [isLoadingAuth, user, navigate]);

    // 프로필 저장 핸들러
    const handleSaveProfile = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || isSubmitting) return;
        
        // 1. 프론트엔드에서 Zod로 유효성 검사
        const validationResult = profileFormSchema.safeParse({ name, position: selectedPosition, academyName, region });
        if (!validationResult.success) {
            setFormErrors(validationResult.error.format());
            return;
        }
        
        // 2. 유효성 검사 통과 시, 상태 초기화 및 API 호출 시작
        setFormErrors(null);
        setIsSubmitting(true);
        setApiErrorMessage('');

        try {
            const response = await fetch('/api/profiles/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Zod로 검증된 안전한 데이터를 전송합니다.
                body: JSON.stringify(validationResult.data),
            });
            
            if (response.ok) {
                navigate('/', { replace: true });
            } else {
                const data = await response.json();
                setApiErrorMessage(data.error || '프로필 저장에 실패했습니다.');
            }
        } catch (error) {
            setApiErrorMessage('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 통합 로딩 상태: 인증 로딩 중이거나, 프로필 확인 중일 때는 로딩 화면을 표시합니다.
    const isPageLoading = isLoadingAuth || isCheckingProfile;
    if (isPageLoading) {
        return (
            <div className="profile-setup-page-wrapper">
                <div className="profile-setup-container" style={{ textAlign: 'center' }}>
                    <h1>사용자 정보를 확인하는 중입니다...</h1>
                </div>
            </div>
        );
    }
    
    // 로딩이 모두 끝나고, 프로필이 없는 사용자에게만 폼이 렌더링됩니다.
    return (
        <div className="profile-setup-page-wrapper">
            <div className="login-background-blobs-wrapper">
                <BackgroundBlobs />
            </div>
            <div className="profile-setup-container">
                <h1 className="profile-setup-title">프로필 설정</h1>
                <p className="profile-setup-subtitle">서비스 이용을 위해 추가 정보를 입력해 주세요.</p>
                <form onSubmit={handleSaveProfile} className="profile-setup-form" noValidate>
                    <div className="form-group">
                        <label className="form-label">직급</label>
                        <div className="position-buttons-group">
                            {POSITIONS.map((pos) => (
                                <button type="button" key={pos}
                                    className={`position-button ${selectedPosition === pos ? 'active' : ''}`}
                                    onClick={() => setSelectedPosition(pos)}>
                                    {pos}
                                </button>
                            ))}
                        </div>
                        {formErrors?.position && <p className="error-message">{formErrors.position._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">이름</label>
                        <input type="text" id="name" value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름을 입력하세요" className="form-input" />
                        {formErrors?.name && <p className="error-message">{formErrors.name._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="academyName" className="form-label">학원 이름</label>
                        <input type="text" id="academyName" value={academyName}
                            onChange={(e) => setAcademyName(e.target.value)}
                            placeholder="학원 이름을 입력하세요" className="form-input" />
                        {formErrors?.academyName && <p className="error-message">{formErrors.academyName._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="region" className="form-label">지역</label>
                        <input type="text" id="region" value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="예: 서울특별시 강남구" className="form-input" />
                        {formErrors?.region && <p className="error-message">{formErrors.region._errors[0]}</p>}
                    </div>

                    {apiErrorMessage && <p className="error-message api-error">{apiErrorMessage}</p>}
                    
                    <button type="submit" disabled={isSubmitting} className="submit-button">
                        {isSubmitting ? '저장 중...' : '저장하고 시작하기'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetupPage;