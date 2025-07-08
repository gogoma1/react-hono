import React, { forwardRef, Ref } from 'react';
import { REGIONS } from '../../../entities/profile/ui/regionData';
import { AcademySearch } from '../../academy-search/ui/AcademySearch';
import ProfileSetupInput from '../../../entities/profile/ui/ProfileSetupInput';
import type { Academy } from '../../../entities/academy/model/types';
import { LuRefreshCcw } from 'react-icons/lu';

interface RoleAcademyFormProps {
    selectedPosition: string;
    academyName: string;
    selectedCity: string;
    selectedDistrict: string;
    selectedAcademy: Academy | null;
    needsAcademySelection: boolean;
    validationErrors: { academy?: string };

    setAcademyName: (name: string) => void;
    setSelectedCity: (city: string) => void;
    setSelectedDistrict: (district: string) => void;
    handleAcademySelect: (academy: Academy) => void;
    setSelectedAcademy: (academy: Academy | null) => void;
    handleSelectNoAcademy: () => void;

    academyNameInputRef: Ref<HTMLInputElement>;
    academySearchInputRef: Ref<HTMLInputElement>;
}

export const RoleAcademyForm = forwardRef<HTMLDivElement, RoleAcademyFormProps>(
    (props, ref) => {
        const {
            selectedPosition,
            academyName,
            selectedCity,
            selectedDistrict,
            selectedAcademy,
            needsAcademySelection,
            validationErrors,
            setAcademyName,
            setSelectedCity,
            setSelectedDistrict,
            handleAcademySelect,
            setSelectedAcademy,
            handleSelectNoAcademy,
            academyNameInputRef,
            academySearchInputRef,
        } = props;

        return (
            <div className="details-form-group fade-in" ref={ref}>
                {selectedPosition === '원장' && (
                    <>
                        <ProfileSetupInput
                            id="academyName"
                            label="학원 이름"
                            value={academyName}
                            onChange={(e) => setAcademyName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                            onBlur={() => {}}
                            placeholder="학원 이름을 입력하세요"
                            isCompleted={false}
                            isEditing={true}
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
                    <>
                        <div className="academy-search-header">
                            <label htmlFor="academySearch" className="form-label">학원 검색</label>
                            {['학생', '학부모'].includes(selectedPosition) && (
                                <button type="button" className="no-academy-button" onClick={handleSelectNoAcademy}>
                                    등록된 학원이 없거나, 나중에 등록할게요
                                </button>
                            )}
                        </div>
                        <div className={validationErrors.academy ? 'academy-search-error' : ''}>
                            <AcademySearch 
                                ref={academySearchInputRef} 
                                onAcademySelect={handleAcademySelect} 
                                hideLabel={true} 
                            />
                            {validationErrors.academy && <p className="error-message academy-error-text">{validationErrors.academy}</p>}
                        </div>
                    </>
                )}

                {needsAcademySelection && selectedAcademy && (
                    <div className="selected-academy-display">
                        <h4>선택된 학원</h4>
                        <div className="academy-info-box">
                            <span className="academy-name">{selectedAcademy.name === '없음' ? '학원 없음' : selectedAcademy.name}</span>
                            {selectedAcademy.region && <span className="academy-region">{selectedAcademy.region}</span>}
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
                        <p>이후 단계로 진행하여 저장 버튼을 눌러주세요.</p>
                    </div>
                )}
            </div>
        );
    }
);

RoleAcademyForm.displayName = 'RoleAcademyForm';