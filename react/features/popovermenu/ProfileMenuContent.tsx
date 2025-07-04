import React from 'react';
import { Link, useNavigate } from 'react-router'; // [수정] react-router-dom으로 변경
import { LuUser, LuSettings, LuLogIn, LuLogOut, LuUsers } from 'react-icons/lu'; // [수정] LuUsers 아이콘 추가
import { useAuthStore, selectIsAuthenticated, selectUser, selectIsLoadingAuth } from '../../shared/store/authStore';
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
    const signInWithAnotherAccount = useAuthStore((state) => state.signInWithAnotherAccount); // [신규] 새 액션 가져오기

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
    
    // [신규] '다른 아이디로 로그인' 버튼 클릭 핸들러
    const handleSwitchAccountClick = async () => {
        try {
            await signInWithAnotherAccount();
            // 페이지 이동은 Supabase OAuth 리디렉션이 처리하므로 여기서 할 필요 없음
        } catch (error) {
            console.error("[ProfileMenuContent] Error during account switch:", error);
        } finally {
            handleClose();
        }
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
                            <Link to="/profile" className="profile-menu-item" onClick={handleClose} aria-label="내 프로필 보기" >
                                <LuUser size={16} className="profile-menu-icon" /> <span className="profile-menu-text">내 프로필</span>
                            </Link>
                        </li>
                        <li className="profile-menu-item-li">
                            <Link to="/settings/account" className="profile-menu-item" onClick={handleClose} aria-label="계정 설정으로 이동" >
                                <LuSettings size={16} className="profile-menu-icon" /> <span className="profile-menu-text">계정 설정</span>
                            </Link>
                        </li>
                        {/* --- [신규] 다른 아이디로 로그인 버튼 --- */}
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