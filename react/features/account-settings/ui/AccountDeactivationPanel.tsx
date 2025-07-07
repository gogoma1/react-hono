import React from 'react';
import type { useAccountSettings } from '../model/useAccountSettings';
import LoadingButton from '../../../shared/ui/loadingbutton/LoadingButton';
import './AccountSettingsPanels.css'; // ProfileInfoPanel과 동일한 스타일 시트 재사용

// useAccountSettings 훅의 반환 타입을 그대로 props 타입으로 사용
type AccountDeactivationPanelProps = {
    settings: ReturnType<typeof useAccountSettings>;
};

const AccountDeactivationPanel: React.FC<AccountDeactivationPanelProps> = ({ settings }) => {
    const {
        deactivationConfirmText,
        setDeactivationConfirmText,
        isDeactivationConfirmed,
        handleDeactivateAccount,
        isDeactivating,
    } = settings;

    return (
        <div className="settings-panel-container">
            <header className="panel-header danger-zone-header">
                <h2 className="panel-title">계정 비활성화</h2>
                <p className="panel-description">
                    이 작업은 되돌릴 수 없습니다. 계정을 비활성화하면 모든 데이터 접근이 차단되며,
                    다시는 이 계정으로 로그인할 수 없습니다. 진행 중인 구독은 현재 결제 주기가 끝나면 자동으로 종료됩니다.
                </p>
            </header>

            <div className="settings-form">
                <div className="form-group">
                    <label htmlFor="deactivation-confirm" className="form-label">
                        계속하려면 아래 입력창에 '비활성화'라고 정확히 입력해주세요.
                    </label>
                    <input
                        id="deactivation-confirm"
                        type="text"
                        className="form-input"
                        value={deactivationConfirmText}
                        onChange={(e) => setDeactivationConfirmText(e.target.value)}
                        placeholder="비활성화"
                    />
                </div>

                <footer className="form-footer">
                    <LoadingButton
                        type="button"
                        className="destructive" // 위험한 액션임을 나타내는 클래스
                        isLoading={isDeactivating}
                        disabled={!isDeactivationConfirmed || isDeactivating}
                        onClick={handleDeactivateAccount}
                        loadingText="처리 중..."
                    >
                        이 계정을 영구적으로 비활성화합니다
                    </LoadingButton>
                </footer>
            </div>
        </div>
    );
};

export default AccountDeactivationPanel;