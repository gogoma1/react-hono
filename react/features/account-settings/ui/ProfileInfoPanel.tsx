import React from 'react';
// [신규] setActiveSection 타입을 import 합니다.
import type { useAccountSettings, AccountSettingsSection } from '../model/useAccountSettings';
import LoadingButton from '../../../shared/ui/loadingbutton/LoadingButton';
import './FormPanels.css';
import { LuCirclePlus } from 'react-icons/lu'; // 아이콘 추가

type ProfileInfoPanelProps = {
    settings: ReturnType<typeof useAccountSettings>;
};

const ProfileInfoPanel: React.FC<ProfileInfoPanelProps> = ({ settings }) => {
    const {
        profile,
        register,
        handleSave,
        resetForm,
        formErrors,
        isDirty,
        isUpdating,
        // [신규] setActiveSection을 가져옵니다.
        setActiveSection,
    } = settings;

    if (!profile) return null;

    return (
        <div className="settings-panel-container">
            <header className="panel-header">
                <h2 className="panel-title">일반 정보</h2>
                <p className="panel-description">
                    프로필 이름과 연락처를 수정할 수 있습니다.
                </p>
            </header>

            <form onSubmit={handleSave} className="settings-form">
                {/* 이메일 (읽기 전용) */}
                <div className="form-group">
                    <label htmlFor="email" className="form-label">이메일</label>
                    <input
                        id="email"
                        type="email"
                        className="form-input"
                        value={profile.email}
                        readOnly
                        disabled
                    />
                </div>

                {/* 이름 (수정 가능) */}
                <div className="form-group">
                    <label htmlFor="name" className="form-label">이름</label>
                    <input
                        id="name"
                        type="text"
                        className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                        {...register('name')}
                        placeholder="이름을 입력하세요"
                    />
                    {formErrors.name && <p className="error-message">{formErrors.name.message}</p>}
                </div>

                {/* 전화번호 (수정 가능) */}
                <div className="form-group">
                    <label htmlFor="phone" className="form-label">전화번호</label>
                    <input
                        id="phone"
                        type="tel"
                        className={`form-input ${formErrors.phone ? 'input-error' : ''}`}
                        {...register('phone')}
                        placeholder="010-1234-5678"
                    />
                     {formErrors.phone && <p className="error-message">{formErrors.phone.message}</p>}
                </div>

                {/* 역할 정보 (읽기 전용) */}
                <div className="form-group">
                    <div className="role-header">
                        <label className="form-label">역할 및 소속</label>
                        {/* [신규] 역할 추가 버튼 */}
                        <button 
                            type="button" 
                            className="add-role-button" 
                            onClick={() => setActiveSection('addRole')}
                        >
                            <LuCirclePlus size={14} />
                            <span>역할 추가</span>
                        </button>
                    </div>
                    <div className="role-display-area">
                        {profile.roles.map((role, index) => (
                            <div key={index} className="role-item">
                                <span className="role-name">{role.name}</span>
                                {role.academy_name && (
                                    <span className="role-detail">
                                        ({role.academy_name} - {role.region})
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 폼 액션 버튼 */}
                <footer className="form-footer">
                    <button
                        type="button"
                        className="action-button secondary"
                        onClick={() => resetForm()}
                        disabled={!isDirty || isUpdating}
                    >
                        취소
                    </button>
                    <LoadingButton
                        type="submit"
                        className="primary"
                        isLoading={isUpdating}
                        disabled={!isDirty}
                        loadingText="저장 중..."
                    >
                        변경 내용 저장
                    </LoadingButton>
                </footer>
            </form>
        </div>
    );
};

export default ProfileInfoPanel;