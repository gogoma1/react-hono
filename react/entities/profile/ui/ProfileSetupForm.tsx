import React, { forwardRef, Ref } from 'react';
import type { FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import BackgroundBlobs from '../../../widgets/rootlayout/BackgroundBlobs';
import { REGIONS } from './regionData';
import './ProfileSetupForm.css';
import { LuArrowRight, LuArrowLeft, LuRefreshCcw } from 'react-icons/lu';
import { POSITIONS, type PositionType } from '../model/types';
import { AcademySearch } from '../../../features/academy-search/ui/AcademySearch';
import type { Academy } from '../../academy/model/types';
import ProfileSetupInput from './ProfileSetupInput';

const PrincipalSubmissionHelper: React.FC<{
    academyName: string;
    selectedCity: string;
    selectedDistrict: string;
}> = ({ academyName, selectedCity, selectedDistrict }) => {
    let message = '';
    if (!academyName.trim()) message = '학원 이름을 입력해 주세요.';
    else if (!selectedCity || !selectedDistrict) message = '학원의 지역(시/도, 시/군/구)을 모두 선택해 주세요.';

    if (!message) return null;
    return <div className="submission-helper-text">{message}</div>;
};

interface ProfileSetupFormProps {
    isLoadingAuth: boolean;
    isSubmitting: boolean;
    step: number;
    editingField: 'name' | 'phone' | 'academyName' | null;
    setEditingField: (field: 'name' | 'phone' | 'academyName' | null) => void;
    selectedPosition: PositionType | '';
    name: string;
    phone: string;
    academyName: string;
    selectedCity: string;
    selectedDistrict: string;
    selectedAcademy: Academy | null;
    apiErrorMessage: string;
    isFormComplete: boolean;
    validationErrors: { name?: string; phone?: string; academy?: string };
    needsAcademySelection: boolean;
    setName: (name: string) => void;
    setPhone: (phone: string) => void;
    setAcademyName: (name: string) => void;
    setSelectedCity: (city: string) => void;
    setSelectedDistrict: (district: string) => void;
    setSelectedAcademy: (academy: Academy | null) => void;
    handlePositionSelect: (position: PositionType) => void;
    handleAcademySelect: (academy: Academy) => void;
    handleNameSubmit: (e: KeyboardEvent<HTMLInputElement>) => void;
    handlePhoneChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handlePhoneSubmit: (e: KeyboardEvent<HTMLInputElement>) => void;
    handleReset: () => void;
    handleSaveProfile: (event: FormEvent<HTMLFormElement>) => void;
    handleNextStep: (nextStep: number) => void;
    handleFinishEditing: () => void;
    nameInputRef: Ref<HTMLInputElement>;
    phoneInputRef: Ref<HTMLInputElement>;
    academyNameInputRef: Ref<HTMLInputElement>;
    academySearchInputRef: Ref<HTMLInputElement>;
}

export const ProfileSetupForm = forwardRef<HTMLDivElement, ProfileSetupFormProps>(
    (props, ref) => {
        const {
            isLoadingAuth, isSubmitting, step, editingField, setEditingField, selectedPosition,
            name, phone, academyName, selectedCity, selectedDistrict, selectedAcademy,
            apiErrorMessage, isFormComplete, validationErrors, needsAcademySelection, setName, setPhone, setAcademyName,
            setSelectedCity, setSelectedDistrict, setSelectedAcademy,
            handlePositionSelect, handleAcademySelect, handleNameSubmit, handlePhoneChange, handlePhoneSubmit, 
            handleReset, handleSaveProfile, handleNextStep, handleFinishEditing,
            nameInputRef, phoneInputRef, academyNameInputRef, academySearchInputRef
        } = props;
        
        if (isLoadingAuth) {
            return <div className="profile-setup-page-wrapper loading"><h1>사용자 정보를 확인하는 중입니다...</h1></div>;
        }
        
        const getSubtitle = () => {
            if (step === 1) return "회원님의 유형을 선택해 주세요.";
            if (step === 2) return "이름을 입력하신 후 Enter를 눌러주세요.";
            if (step === 3) return "전화번호를 입력하신 후 Enter를 눌러주세요.";
            if (step >= 4) {
                if (selectedPosition === '원장') return "학원 정보를 입력해주세요.";
                if (needsAcademySelection) return selectedAcademy ? "마지막 단계입니다! 아래 버튼을 눌러 완료하세요." : "소속될 학원을 검색하여 선택해주세요.";
                return "마지막 단계입니다! 아래 버튼을 눌러 완료하세요.";
            }
            return "";
        };
        
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
                    <p className="profile-setup-subtitle">{getSubtitle()}</p>
                    
                    <form onSubmit={handleSaveProfile} className="profile-setup-form" noValidate>
                        <div 
                            className={`form-group step-1-group`}
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
                            <ProfileSetupInput
                                id="name"
                                label="이름"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={handleNameSubmit}
                                onBlur={handleFinishEditing}
                                placeholder={validationErrors.name || "이름 입력 후 Enter"}
                                isCompleted={step > 2}
                                isEditing={editingField === 'name'}
                                onStartEdit={() => setEditingField('name')}
                                readOnly={step > 2 && editingField !== 'name'}
                                errorMessage={validationErrors.name}
                                ref={nameInputRef}
                                nextButton={
                                    step === 2 && name.trim() && (
                                        <button type="button" className="next-step-button" onClick={(e) => { e.stopPropagation(); handleNextStep(3); }}>
                                            <LuArrowRight />
                                        </button>
                                    )
                                }
                            />
                        )}
                        
                        {step >= 3 && (
                            <ProfileSetupInput
                                id="phone"
                                label="전화번호"
                                type="tel"
                                maxLength={13}
                                value={phone}
                                onChange={handlePhoneChange}
                                onKeyDown={handlePhoneSubmit}
                                onBlur={handleFinishEditing}
                                placeholder={validationErrors.phone || "010-1234-5678"}
                                isCompleted={step > 3}
                                isEditing={editingField === 'phone'}
                                onStartEdit={() => setEditingField('phone')}
                                readOnly={step > 3 && editingField !== 'phone'}
                                errorMessage={validationErrors.phone}
                                ref={phoneInputRef}
                                nextButton={
                                    step === 3 && phone.trim() && /^[0-9]{3}-[0-9]{3,4}-[0-9]{4}$/.test(phone) && (
                                        <button type="button" className="next-step-button" onClick={(e) => { e.stopPropagation(); handleNextStep(4); }}>
                                            <LuArrowRight />
                                        </button>
                                    )
                                }
                            />
                        )}

                        {step >= 4 && (
                            <div className="details-form-group fade-in">
                                {selectedPosition === '원장' && (
                                    <>
                                        <ProfileSetupInput
                                            id="academyName"
                                            label="학원 이름"
                                            value={academyName}
                                            onChange={(e) => setAcademyName(e.target.value)}
                                            onKeyDown={(e) => {if (e.key === 'Enter') e.preventDefault()}}
                                            onBlur={handleFinishEditing}
                                            placeholder="학원 이름을 입력하세요"
                                            isCompleted={false} // 원장 학원이름은 다음 단계가 없으므로 항상 false
                                            isEditing={true} // 항상 수정 가능한 상태로
                                            onStartEdit={() => {}}
                                            readOnly={false}
                                            ref={academyNameInputRef}
                                        />
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
                                )}

                                {needsAcademySelection && !selectedAcademy && (
                                    <div className={validationErrors.academy ? 'academy-search-error' : ''}>
                                        <AcademySearch ref={academySearchInputRef} onAcademySelect={handleAcademySelect} />
                                        {validationErrors.academy && <p className="error-message academy-error-text">{validationErrors.academy}</p>}
                                    </div>
                                )}

                                {needsAcademySelection && selectedAcademy && (
                                    <div className="selected-academy-display">
                                        <h4>선택된 학원</h4>
                                        <div className="academy-info-box">
                                            <span className="academy-name">{selectedAcademy.name}</span>
                                            <span className="academy-region">{selectedAcademy.region}</span>
                                            <button type="button" onClick={() => setSelectedAcademy(null)} className="change-academy-button">
                                                <LuRefreshCcw size={14} />
                                                <span>다시 선택</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {selectedPosition === '과외 선생님' && (
                                    <div className="setup-complete-message">
                                        <h4>프로필 설정 준비 완료!</h4>
                                        <p>아래 '저장하고 시작하기' 버튼을 눌러주세요.</p>
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
                                step >= 4 && selectedPosition === '원장' && (
                                    <PrincipalSubmissionHelper
                                        academyName={academyName}
                                        selectedCity={selectedCity}
                                        selectedDistrict={selectedDistrict}
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