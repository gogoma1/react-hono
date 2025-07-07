// ./react/features/profile-role-management/ui/AddRolePanel.tsx

import React from 'react';
import { useAddRole } from '../model/useAddRole';
import { RoleAcademyForm } from './RoleAcademyForm';
import LoadingButton from '../../../shared/ui/loadingbutton/LoadingButton';
import { POSITIONS } from '../../../entities/profile/model/types';
import Tippy from '@tippyjs/react';
import './AddRolePanel.css';

interface AddRolePanelProps {
    onCancel: () => void;
}

export const AddRolePanel: React.FC<AddRolePanelProps> = ({ onCancel }) => {
    const {
        handleSave,
        isSubmitting,
        isFormComplete,
        apiErrorMessage,
        disabledRoles,
        ...roleAcademyFormProps
    } = useAddRole(onCancel);

    return (
        <div className="settings-panel-container">
            <header className="panel-header">
                <h2 className="panel-title">역할 추가</h2>
                <p className="panel-description">
                    현재 계정에 새로운 역할과 소속을 추가합니다.
                    <br />
                    (학생/강사 역할 추가 시, 학원에 등록된 전화번호와 계정 전화번호가 일치해야 합니다.)
                </p>
            </header>

            <form onSubmit={handleSave} className="settings-form" noValidate>
                {/* [핵심 수정] 학원 선택 UI를 먼저 보여줍니다. */}
                <RoleAcademyForm {...roleAcademyFormProps} />
                
                {/* [핵심 수정] 학원 선택이 필요한데 아직 선택되지 않았다면, 역할 선택 UI를 비활성화합니다. */}
                {roleAcademyFormProps.needsAcademySelection && !roleAcademyFormProps.selectedAcademy ? (
                    <div className="form-group">
                        <label className="form-label">역할 선택</label>
                        <div className="role-selection-disabled-overlay">
                            학원을 먼저 선택해주세요.
                        </div>
                    </div>
                ) : (
                    <div className="form-group">
                        <label className="form-label">역할 선택 *</label>
                        <div className="position-buttons-group">
                            {POSITIONS.map((pos) => {
                                const disabledReason = disabledRoles.get(pos);
                                const isDisabled = !!disabledReason;

                                const button = (
                                    <button
                                        type="button"
                                        key={pos}
                                        className={`position-button omr-button status-button ${roleAcademyFormProps.selectedPosition === pos ? 'active' : ''}`}
                                        onClick={() => roleAcademyFormProps.handlePositionSelect(pos)}
                                        disabled={isDisabled}
                                    >
                                        {pos}
                                    </button>
                                );

                                // 비활성화된 버튼에 툴팁을 적용합니다.
                                return isDisabled ? (
                                    <Tippy content={disabledReason} theme="custom-glass" key={pos}>
                                        <span className="disabled-button-wrapper">{button}</span>
                                    </Tippy>
                                ) : (
                                    button
                                );
                            })}
                        </div>
                        {roleAcademyFormProps.validationErrors.position && (
                            <p className="error-message">{roleAcademyFormProps.validationErrors.position}</p>
                        )}
                    </div>
                )}

                {apiErrorMessage && (
                    <p className="error-message api-error">{apiErrorMessage}</p>
                )}

                <footer className="form-footer">
                    <button type="button" className="action-button secondary" onClick={onCancel} disabled={isSubmitting}>
                        취소
                    </button>
                    <LoadingButton
                        type="submit"
                        className="primary"
                        isLoading={isSubmitting}
                        disabled={!isFormComplete || isSubmitting}
                        loadingText="추가 중..."
                    >
                        역할 추가
                    </LoadingButton>
                </footer>
            </form>
        </div>
    );
};