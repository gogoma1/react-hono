import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { useAuthStore, selectUser, selectIsLoadingAuth } from '../../../shared/store/authStore';
import BackgroundBlobs from '../../../widgets/rootlayout/BackgroundBlobs';
import { AcademySearch } from '../../../features/academy-search/ui/AcademySearch';
import type { Academy } from '../../academy/model/types';
import { REGIONS } from './regionData';
import './ProfileSetupForm.css';
import { LuArrowRight, LuArrowLeft } from 'react-icons/lu'; // LuArrowLeft 아이콘 추가

const POSITIONS = ['원장', '강사', '학생', '학부모'] as const;
type PositionType = typeof POSITIONS[number];

const profileFormSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  position: z.enum(POSITIONS, { errorMap: () => ({ message: "역할을 선택해주세요." }) }),
  academyName: z.string().min(1, "학원 이름은 필수 항목입니다.").max(150),
  region: z.string().min(1, "지역은 필수 항목입니다.").max(100),
});
type ProfileFormSchema = z.infer<typeof profileFormSchema>;

export const ProfileSetupForm: React.FC = () => {
    const navigate = useNavigate();
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
    const user = useAuthStore(selectUser);

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [step, setStep] = useState(1);
    const [selectedPosition, setSelectedPosition] = useState<PositionType | ''>('');
    const [name, setName] = useState('');
    const [academyName, setAcademyName] = useState('');
    
    const [selectedCity, setSelectedCity] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [region, setRegion] = useState('');

    const [formErrors, setFormErrors] = useState<z.ZodFormattedError<ProfileFormSchema> | null>(null);
    const [apiErrorMessage, setApiErrorMessage] = useState('');
    
    // [신규] 최종 제출 버튼 활성화 여부 결정
    const isFormComplete = useMemo(() => {
        if (step < 3) return false;
        if (!name.trim() || !selectedPosition) return false;
        if (selectedPosition === '학생') {
            return !!academyName && !!region;
        } else {
            return !!academyName && !!selectedCity && !!selectedDistrict;
        }
    }, [step, name, selectedPosition, academyName, region, selectedCity, selectedDistrict]);

    useEffect(() => {
       if (user) {
           setName(user.user_metadata?.name || '');
       }
    }, [isLoadingAuth, user]);
    
    const handlePositionSelect = (position: PositionType) => {
        setSelectedPosition(position);
        setStep(2);
    };

    const handleNameSubmit = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (name.trim()) setStep(3);
        }
    }, [name]);
    
    const handleAcademySelect = (academy: Academy) => {
        setAcademyName(academy.academyName);
        setRegion(academy.region);
    };

    const goBack = (toStep: number) => {
        setStep(toStep);
    };

    const handleSaveProfile = async (event: React.FormEvent) => {
        // ... (기존 저장 로직과 동일) ...
        event.preventDefault();
        if (!isFormComplete || !user || isSubmitting) return;

        const finalRegion = selectedPosition === '학생' ? region : `${selectedCity} ${selectedDistrict}`;
        const validationResult = profileFormSchema.safeParse({ name, position: selectedPosition, academyName, region: finalRegion });

        if (!validationResult.success) {
            setFormErrors(validationResult.error.format());
            return;
        }
        
        setFormErrors(null);
        setIsSubmitting(true);
        setApiErrorMessage('');

        try {
            const response = await fetch('/api/profiles/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

    if (isLoadingAuth) {
        return <div className="profile-setup-page-wrapper loading"><h1>사용자 정보를 확인하는 중입니다...</h1></div>;
    }
    
    return (
        <div className="profile-setup-page-wrapper">
            <div className="login-background-blobs-wrapper"><BackgroundBlobs /></div>
            <div className="profile-setup-container">
                {step > 1 && (
                    <button type="button" onClick={() => goBack(step - 1)} className="back-button">
                        <LuArrowLeft /> 뒤로가기
                    </button>
                )}
                <h1 className="profile-setup-title">프로필 설정</h1>
                <p className="profile-setup-subtitle">
                    {step === 1 && "서비스를 이용하기 위해 역할을 선택해주세요."}
                    {step === 2 && "이름을 입력하신 후 Enter를 눌러주세요."}
                    {step === 3 && "마지막 단계입니다! 상세 정보를 입력해주세요."}
                </p>
                
                <form onSubmit={handleSaveProfile} className="profile-setup-form" noValidate>
                    <div className={`form-group step-1-group ${step > 1 ? 'step-completed' : ''}`}>
                        <label className="form-label">역할</label>
                        <div className="position-buttons-group">
                            {POSITIONS.map((pos) => (
                                <button type="button" key={pos}
                                    className={`position-button omr-button status-button ${selectedPosition === pos ? 'active' : ''}`}
                                    onClick={() => handlePositionSelect(pos)}
                                    disabled={step > 1 && selectedPosition !== pos}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>

                    {step >= 2 && (
                        <div className={`form-group fade-in ${step > 2 ? 'step-completed' : ''}`}>
                            <label htmlFor="name" className="form-label">이름</label>
                            <div className="input-with-button">
                                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleNameSubmit} placeholder="이름 입력 후 Enter" className="form-input" readOnly={step > 2} />
                                {step === 2 && name.trim() && (
                                    <button type="button" className="next-step-button" onClick={() => setStep(3)}><LuArrowRight /></button>
                                )}
                            </div>
                            {formErrors?.name && <p className="error-message">{formErrors.name._errors[0]}</p>}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="details-form-group fade-in">
                            {selectedPosition === '학생' ? (
                                // [핵심] 학생이 학원을 아직 선택하지 않았을 때만 검색 UI 표시
                                !academyName ? (
                                    <AcademySearch onAcademySelect={handleAcademySelect} />
                                ) : (
                                    // 학원 선택 후에는 읽기 전용 UI 표시
                                    <div className="form-group">
                                        <label className="form-label">학원 정보</label>
                                        <div className="selected-info-display" onClick={() => setAcademyName('')}>
                                            <p><strong>{academyName}</strong> ({region})</p>
                                            <span>(클릭하여 다시 검색)</span>
                                        </div>
                                    </div>
                                )
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label htmlFor="academyName" className="form-label">학원 이름</label>
                                        <input type="text" id="academyName" value={academyName} onChange={(e) => setAcademyName(e.target.value)} placeholder="학원 이름을 입력하세요" className="form-input" />
                                        {formErrors?.academyName && <p className="error-message">{formErrors.academyName._errors[0]}</p>}
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">지역 (시/도)</label>
                                        <div className="region-button-group">
                                            {Object.keys(REGIONS).map(city => (
                                                <button type="button" key={city} onClick={() => { setSelectedCity(city); setSelectedDistrict(''); }} className={`region-button ${selectedCity === city ? 'active' : ''}`}>{city}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {selectedCity && (
                                        <div className="form-group fade-in">
                                            <label className="form-label">지역 (시/군/구)</label>
                                            <div className="region-button-group">
                                                {REGIONS[selectedCity as keyof typeof REGIONS]?.map(district => (
                                                    <button type="button" key={district} onClick={() => setSelectedDistrict(district)} className={`region-button ${selectedDistrict === district ? 'active' : ''}`}>{district}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {formErrors?.region && <p className="error-message">{formErrors.region._errors[0]}</p>}
                                </>
                            )}
                            {apiErrorMessage && <p className="error-message api-error">{apiErrorMessage}</p>}
                        </div>
                    )}
                    
                    {/* [핵심] 모든 정보가 입력되었을 때만 제출 버튼 표시 */}
                    {isFormComplete && (
                         <button type="submit" disabled={isSubmitting} className="submit-button fade-in">
                            {isSubmitting ? '저장 중...' : '저장하고 시작하기'}
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};