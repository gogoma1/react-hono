import React from 'react';
// [수정] react-router에서 Link는 제거하고 useNavigate만 사용합니다.
import { useNavigate } from 'react-router';
import { LuUser, LuSettings, LuLogIn, LuLogOut, LuUsers } from 'react-icons/lu';
import { useAuthStore, selectIsAuthenticated, selectUser, selectIsLoadingAuth } from '../../shared/store/authStore';
// [신규] modalStore를 import 합니다.
import { useModalStore } from '../../shared/store/modalStore';
import './ProfileMenuContent.css';

interface ProfileMenuContentProps {
    onClose?: () => void;
}

const ProfileMenuContent: React.FC<ProfileMenuContentProps> = ({ onClose }) => {
    const navigate = useNavigate();
    
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const user = useAuthStore(selectUser);
    const isLoading = useAuthStore(selectIsLoadingAuth);
    const signOut = useAuthStore((state) => state.signOut);
    const signInWithAnotherAccount = useAuthStore((state) => state.signInWithAnotherAccount);
    
    // [신규] modalStore에서 계정 설정 모달을 여는 함수를 가져옵니다.
    const openAccountSettings = useModalStore((state) => state.openAccountSettings);

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
        handleClose();
    };

    const handleLogoutClick = async () => {
        try {
            await signOut();
            navigate('/login', { replace: true });
        } catch (error) {
            console.error("[ProfileMenuContent] Error during sign out:", error);
            navigate('/login', { replace: true });
        } finally {
            handleClose();
        }
    };
    
    const handleSwitchAccountClick = async () => {
        try {
            await signInWithAnotherAccount();
        } catch (error) {
            console.error("[ProfileMenuContent] Error during account switch:", error);
        } finally {
            handleClose();
        }
    };
    
    // [신규] 계정 설정 버튼 클릭 핸들러
    const handleSettingsClick = () => {
        openAccountSettings(); // 모달을 엽니다.
        handleClose(); // 팝오버 메뉴는 닫습니다.
    };

    if (isLoading) {
        return <div className="profile-popover-content loading-state"><p>로딩 중...</p></div>;
    }

    return (
        <div className="profile-popover-content">
            {isAuthenticated && user ? (
                <>
                    <div className="profile-user-info">
                        <p className="profile-user-name">{user.user_metadata?.name || user.user_metadata?.full_name || '사용자'}</p>
                        <p className="profile-user-email">{user.email}</p>
                    </div>
                    <ul className="profile-menu-list">
                        <li className="profile-menu-item-li">
                            {/* '내 프로필'은 아직 페이지가 없으므로 일단 버튼으로 유지하거나, 나중에 Link로 변경할 수 있습니다. */}
                            <button type="button" className="profile-menu-item" onClick={handleClose} aria-label="내 프로필 보기" >
                                <LuUser size={16} className="profile-menu-icon" /> <span className="profile-menu-text">내 프로필</span>
                            </button>
                        </li>
                        <li className="profile-menu-item-li">
                            {/* [수정] Link를 button으로 변경하고 onClick 핸들러를 연결합니다. */}
                            <button type="button" className="profile-menu-item" onClick={handleSettingsClick} aria-label="계정 설정으로 이동" >
                                <LuSettings size={16} className="profile-menu-icon" /> <span className="profile-menu-text">계정 설정</span>
                            </button>
                        </li>
                        <li className="profile-menu-item-li">
                            <button type="button" className="profile-menu-item" onClick={handleSwitchAccountClick} aria-label="다른 아이디로 로그인">
                                <LuUsers size={16} className="profile-menu-icon" /> <span className="profile-menu-text">다른 아이디로 로그인</span>
                            </button>
                        </li>
                        <li className="profile-menu-item-li">
                            <button type="button" className="profile-menu-item" onClick={handleLogoutClick} aria-label="로그아웃" >
                                <LuLogOut size={16} className="profile-menu-icon" /> <span className="profile-menu-text">로그아웃</span>
                            </button>
                        </li>
                    </ul>
                </>
            ) : (
                <ul className="profile-menu-list">
                    <li className="profile-menu-item-li">
                        <button type="button" className="profile-menu-item" onClick={handleLoginClick} aria-label="로그인" >
                            <LuLogIn size={16} className="profile-menu-icon" /> <span className="profile-menu-text">로그인</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default ProfileMenuContent;