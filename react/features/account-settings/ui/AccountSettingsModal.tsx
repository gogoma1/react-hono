import React from 'react';
import Modal from '../../../shared/ui/modal/Modal';
import { useModalStore } from '../../../shared/store/modalStore';
import { useAccountSettings } from '../model/useAccountSettings';
import ProfileInfoPanel from './ProfileInfoPanel';
import AccountDeactivationPanel from './AccountDeactivationPanel';
import { AddRolePanel } from '../../profile-role-management/ui/AddRolePanel';
// [신규] LuArrowLeft 아이콘을 import 합니다.
import { LuUser, LuShieldAlert, LuArrowLeft } from 'react-icons/lu';
import './AccountSettingsModal.css';

const AccountSettingsModal: React.FC = () => {
    const { isAccountSettingsOpen, closeAccountSettings } = useModalStore();

    const settings = useAccountSettings();
    const { activeSection, setActiveSection, profile, handleReturnToGeneral } = settings;

    if (settings.isLoadingProfile) {
        return (
            <Modal isOpen={isAccountSettingsOpen} onClose={closeAccountSettings} title="계정 설정" size="large">
                <div className="settings-loading-container">
                    <p>사용자 정보를 불러오는 중입니다...</p>
                </div>
            </Modal>
        );
    }

    if (settings.isError || !profile) {
         return (
            <Modal isOpen={isAccountSettingsOpen} onClose={closeAccountSettings} title="오류" size="small">
                <div className="settings-error-container">
                    <p>프로필 정보를 불러오는 데 실패했습니다.</p>
                    <pre>{settings.error?.message}</pre>
                </div>
            </Modal>
        );
    }
    
    const isAddRoleMode = activeSection === 'addRole';

    // [신규] 모달 제목을 동적으로 결정합니다.
    const modalTitle = isAddRoleMode ? (
        // '역할 추가' 모드일 때는 뒤로가기 버튼을 제목 대신 렌더링합니다.
        <button onClick={handleReturnToGeneral} className="modal-back-button" aria-label="뒤로 가기">
            <LuArrowLeft size={18} />
            <span>설정</span>
        </button>
    ) : (
        "설정"
    );

    return (
        <Modal
            isOpen={isAccountSettingsOpen}
            onClose={closeAccountSettings}
            title={modalTitle} // [수정] 동적으로 생성된 제목(또는 버튼)을 전달합니다.
            hideFooter={true}
            size="large"
        >
            <div className="account-settings-content">
                {!isAddRoleMode && (
                    <nav className="settings-sidebar">
                        <button
                            className={`sidebar-button ${activeSection === 'general' ? 'active' : ''}`}
                            onClick={() => setActiveSection('general')}
                        >
                            <LuUser className="sidebar-icon" />
                            <span>일반</span>
                        </button>
                        <button
                            className={`sidebar-button ${activeSection === 'account' ? 'active' : ''}`}
                            onClick={() => setActiveSection('account')}
                        >
                            <LuShieldAlert className="sidebar-icon" />
                            <span>계정</span>
                        </button>
                    </nav>
                )}
                
                <main className={`settings-main-content ${isAddRoleMode ? 'full-width in-add-role-mode' : ''}`}>
                    {activeSection === 'general' && (
                        <ProfileInfoPanel settings={settings} />
                    )}
                    {activeSection === 'account' && (
                        <AccountDeactivationPanel settings={settings} />
                    )}
                    {activeSection === 'addRole' && (
                        <AddRolePanel onCancel={handleReturnToGeneral} />
                    )}
                </main>
            </div>
        </Modal>
    );
};

export default AccountSettingsModal;