import React from 'react';
import { Link, useNavigate } from 'react-router'; //이게 올바른 import로 바뀜.
import { LuUser, LuSettings, LuLogIn, LuLogOut } from 'react-icons/lu';
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