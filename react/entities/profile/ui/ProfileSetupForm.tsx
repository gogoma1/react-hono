import React, { forwardRef } from 'react';
import type { FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import BackgroundBlobs from '../../../widgets/rootlayout/BackgroundBlobs';
import { REGIONS } from './regionData'; // [복원] REGIONS import 사용
import './ProfileSetupForm.css';
import { LuArrowRight, LuArrowLeft } from 'react-icons/lu';
import { POSITIONS, type PositionType } from '../model/types';

// SubmissionHelper는 이전 버전으로 충분합니다.
const SubmissionHelper: React.FC<{
    academyName: string;
    selectedPosition: PositionType | '';
    selectedCity: string;
    selectedDistrict: string;
    phone: string;
}> = ({ academyName, selectedPosition, selectedCity, selectedDistrict, phone }) => {
    let message = '';
    
    const phoneRegex = /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/;
    if (!phone.trim()) {
        message = '전화번호를 입력해 주세요.'
    } else if (!phoneRegex.test(phone)) {
        message = '올바른 전화번호를 입력해주세요. (예: 010-1234-5678)';
    }

    if (message) return <div className="submission-helper-text">{message}</div>;

    if (selectedPosition === '원장') {
        if (!academyName.trim()) message = '학원 이름을 입력해 주세요.';
        else if (!selectedCity || !selectedDistrict) message = '학원의 지역(시/도, 시/군/구)을 모두 선택해 주세요.';
    }

    if (!message) return null;
    return <div className="submission-helper-text">{message}</div>;
};

// Props 타입은 이전 버전으로 충분합니다.
interface ProfileSetupFormProps {
    isLoadingAuth: boolean;
    isSubmitting: boolean;
    step: number;
    editingField: 'name' | 'phone' | null;
    setEditingField: (field: 'name' | 'phone' | null) => void;
    selectedPosition: PositionType | '';
    name: string;
    phone: string;
    academyName: string;
    selectedCity: string;
    selectedDistrict: string;
    apiErrorMessage: string;
    isFormComplete: boolean;
    setName: (name: string) => void;
    setPhone: (phone: string) => void;
    setAcademyName: (name: string) => void;
    setSelectedCity: (city: string) => void;
    setSelectedDistrict: (district: string) => void;
    handlePositionSelect: (position: PositionType) => void;
    handleNameSubmit: (e: KeyboardEvent<HTMLInputElement>) => void;
    handlePhoneChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handlePhoneSubmit: (e: KeyboardEvent<HTMLInputElement>) => void;
    handleReset: () => void;
    handleSaveProfile: (event: FormEvent<HTMLFormElement>) => void;
    handleNextStep: (nextStep: number) => void;
}

export const ProfileSetupForm = forwardRef<HTMLDivElement, ProfileSetupFormProps>(
    (props, ref) => {
        const {
            isLoadingAuth, isSubmitting, step, editingField, setEditingField, selectedPosition,
            name, phone, academyName, selectedCity, selectedDistrict,
            apiErrorMessage, isFormComplete, setName, setPhone, setAcademyName,
            setSelectedCity, setSelectedDistrict,
            handlePositionSelect, handleNameSubmit, handlePhoneChange, handlePhoneSubmit, 
            handleReset, handleSaveProfile, handleNextStep
        } = props;
        
        if (isLoadingAuth) {
            return <div className="profile-setup-page-wrapper loading"><h1>사용자 정보를 확인하는 중입니다...</h1></div>;
        }
        
        return (
            <div className="profile-setup-page-wrapper">
                <div className="login-background-blobs-wrapper"><BackgroundBlobs /></div>
                <div className="profile-setup-container" ref={ref}>
                    {step > 1 && (
                        <button type="button" onClick={handleReset} className="back-button">
                            <LuArrowLeft /> 설정 초기화
                        </button>
                    )}
                    <h1 className="profile-setup-title">프로필 설정</h1>
                    <p className="profile-setup-subtitle">
                        {step === 1 && "회원님의 유형을 선택해 주세요."}
                        {step === 2 && "이름을 입력하신 후 Enter를 눌러주세요."}
                        {step === 3 && "전화번호를 입력하신 후 Enter를 눌러주세요."}
                        {step >= 4 && selectedPosition === '원장' && "학원 정보를 입력해주세요."}
                        {step >= 4 && selectedPosition !== '원장' && "마지막 단계입니다! 아래 버튼을 눌러 완료하세요."}
                    </p>
                    
                    <form onSubmit={handleSaveProfile} className="profile-setup-form" noValidate>
                        <div 
                            className={`form-group step-1-group ${step > 1 ? 'step-completed' : ''}`}
                            onClick={() => { if(step > 1) handleReset() }}
                        >
                            <div className="position-buttons-group">
                                {POSITIONS.map((pos) => (
                                    <button type="button" key={pos}
                                        className={`position-button omr-button status-button ${selectedPosition === pos ? 'active' : ''}`}
                                        onClick={(e) => { e.stopPropagation(); handlePositionSelect(pos); }}
                                        disabled={step > 1 && selectedPosition !== pos}
                                    >
                                        {pos}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {step >= 2 && (
                            <div 
                                className={`form-group fade-in ${step > 2 ? 'step-completed' : ''}`}
                                onClick={() => step > 2 && setEditingField('name')}
                            >
                                <label htmlFor="name" className="form-label">이름</label>
                                <div className="input-with-button">
                                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleNameSubmit} placeholder="이름 입력 후 Enter" className="form-input" readOnly={step > 2 && editingField !== 'name'} />
                                    {step === 2 && name.trim() && (
                                        <button type="button" className="next-step-button" onClick={(e) => { e.stopPropagation(); handleNextStep(3); }}><LuArrowRight /></button>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {step >= 3 && (
                             <div 
                                className={`form-group fade-in ${step > 3 ? 'step-completed' : ''}`}
                                onClick={() => step > 3 && setEditingField('phone')}
                             >
                                <label htmlFor="phone" className="form-label">전화번호</label>
                                <div className="input-with-button">
                                    <input type="tel" id="phone" value={phone} onChange={handlePhoneChange} onKeyDown={handlePhoneSubmit} placeholder="010-1234-5678" className="form-input" readOnly={step > 3 && editingField !== 'phone'} maxLength={13}/>
                                    {step === 3 && phone.trim() && /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/.test(phone) && (
                                        <button type="button" className="next-step-button" onClick={(e) => { e.stopPropagation(); handleNextStep(4); }}><LuArrowRight /></button>
                                    )}
                                </div>
                            </div>
                        )}

                        {step >= 4 && (
                            <div className="details-form-group fade-in">
                                {selectedPosition === '원장' ? (
                                    // [복원] 원장일 경우 학원 정보 입력 UI
                                    <>
                                        <div className="form-group">
                                            <label htmlFor="academyName" className="form-label">학원 이름</label>
                                            <input type="text" id="academyName" value={academyName} onChange={(e) => setAcademyName(e.target.value)} placeholder="학원 이름을 입력하세요" className="form-input" />
                                        </div>
                                        <div className="form-divider"/>
                                        <div className="region-selection-area">
                                            <div className="form-group">
                                                <label className="form-label">지역 (시/도)</label>
                                                <div className="region-button-group">
                                                    {Object.keys(REGIONS).map(city => (
                                                        <button type="button" key={city} onClick={() => { setSelectedCity(city); setSelectedDistrict(''); }} className={`region-button ${selectedCity === city ? 'active' : ''}`}>{city}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            {selectedCity && (
                                                <>
                                                    <div className="region-divider"></div>
                                                    <div className="form-group fade-in">
                                                        <label className="form-label">지역 (시/군/구)</label>
                                                        <div className="region-button-group">
                                                            {REGIONS[selectedCity as keyof typeof REGIONS]?.map(district => (
                                                                <button type="button" key={district} onClick={() => setSelectedDistrict(district)} className={`region-button ${selectedDistrict === district ? 'active' : ''}`}>{district}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="setup-complete-message">
                                        <h4>프로필 설정 준비 완료!</h4>
                                        <p>아래 '저장하고 시작하기' 버튼을 눌러주세요.</p>
                                        <p>학원 등록은 로그인 후 대시보드에서 진행할 수 있습니다.</p>
                                    </div>
                                )}
                                {apiErrorMessage && <p className="error-message api-error">{apiErrorMessage}</p>}
                            </div>
                        )}
                        
                        <div className="submission-area">
                            {isFormComplete ? (
                                <button type="submit" disabled={isSubmitting} className="submit-button fade-in">
                                    {isSubmitting ? '저장 중...' : '저장하고 시작하기'}
                                </button>
                            ) : (
                                step >= 4 && (
                                    <SubmissionHelper
                                        academyName={academyName}
                                        selectedPosition={selectedPosition}
                                        selectedCity={selectedCity}
                                        selectedDistrict={selectedDistrict}
                                        phone={phone}
                                    />
                                )
                            )}
                        </div>
                    </form>
                </div>
            </div>
        );
    }
);