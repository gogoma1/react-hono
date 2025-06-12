import React from 'react';
import { Link, useNavigate } from 'react-router'; // react-router-dom에서 useNavigate 가져오기
import { LuUser, LuSettings, LuLogIn, LuLogOut } from 'react-icons/lu';
// [수정 1] 새로운 authStore 경로와 필요한 상태/액션을 가져옵니다.
import { useAuthStore, selectIsAuthenticated, selectUser, selectIsLoadingAuth } from '../../shared/store/authStore';

interface ProfileMenuContentProps {
    onClose?: () => void;
}

// 스타일 정의 (변경 없음)
const styles = {
    popoverContent: { minWidth: '200px', backgroundColor: 'var(--glass-base-bg, rgba(255, 255, 255, 0.8))', backdropFilter: 'blur(10px)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', overflow: 'hidden', } as React.CSSProperties,
    userInfoSection: { padding: '12px 16px', borderBottom: '1px solid var(--border-color-light, rgba(0, 0, 0, 0.1))', } as React.CSSProperties,
    userName: { margin: 0, fontWeight: 600, fontSize: '15px', color: 'var(--text-color-primary, #333)', } as React.CSSProperties,
    userEmail: { margin: '4px 0 0', fontSize: '13px', color: 'var(--text-color-secondary, #777)', } as React.CSSProperties,
    menuList: { listStyle: 'none', margin: 0, padding: '8px 0', } as React.CSSProperties,
    menuItemLi: { padding: '0', } as React.CSSProperties,
    commonMenuItem: { display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-color-primary, #333)', textDecoration: 'none', } as React.CSSProperties,
    menuItemIcon: { marginRight: '12px', flexShrink: 0, } as React.CSSProperties,
    menuItemText: { flexGrow: 1, } as React.CSSProperties,
};


const ProfileMenuContent: React.FC<ProfileMenuContentProps> = ({ onClose }) => {
    const navigate = useNavigate();
    
    // [수정 2] 새로운 authStore의 selector를 사용하여 상태를 가져옵니다.
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const user = useAuthStore(selectUser);
    const isLoading = useAuthStore(selectIsLoadingAuth);
    const signOut = useAuthStore((state) => state.signOut); // signOut 액션을 가져옵니다.

    const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
        handleClose();
    };

    // [수정 3] 로그아웃 로직을 새로운 authStore의 signOut 액션을 사용하도록 변경합니다.
    const handleLogoutClick = async () => {
        try {
            await signOut(); // 스토어의 signOut 함수 호출 (내부적으로 supabase.auth.signOut() 실행)
            // 성공적으로 로그아웃되면 onAuthStateChange 리스너가 상태를 자동으로 업데이트합니다.
            
            navigate('/login', { replace: true }); // 로그인 페이지로 이동
        } catch (error) {
            console.error("[ProfileMenuContent] Error during sign out:", error);
            // 에러가 발생하더라도 UI/UX를 위해 로그인 페이지로 보내는 것이 좋을 수 있습니다.
            navigate('/login', { replace: true });
        } finally {
            handleClose(); // 팝오버 닫기
        }
    };

    const getMenuItemStyle = (itemName: string): React.CSSProperties => ({
        ...styles.commonMenuItem,
        backgroundColor: hoveredItem === itemName ? 'var(--hover-bg-color-light, rgba(0, 0, 0, 0.05))' : 'transparent',
        transition: 'background-color 0.2s ease-in-out',
    });

    // [수정 4] 로딩 상태 확인을 `isLoadingAuth` 기준으로 단순화합니다.
    if (isLoading) {
        return <div style={{ ...styles.popoverContent, padding: '20px', textAlign: 'center' }}><p>로딩 중...</p></div>;
    }

    return (
        <div style={styles.popoverContent}>
            {/* [수정 5] 인증 상태 확인 로직을 새로운 상태값으로 변경합니다. */}
            {isAuthenticated && user ? (
                <>
                    <div style={styles.userInfoSection}>
                        {/* [수정 6] Supabase user 객체 구조에 맞게 사용자 이름 접근 방식을 수정합니다. */}
                        <p style={styles.userName}>{user.user_metadata?.name || user.user_metadata?.full_name || '사용자'}</p>
                        <p style={styles.userEmail}>{user.email}</p>
                    </div>
                    <ul style={styles.menuList}>
                        <li style={styles.menuItemLi}>
                            <Link to="/profile" style={getMenuItemStyle('profile')} onClick={handleClose} onMouseEnter={() => setHoveredItem('profile')} onMouseLeave={() => setHoveredItem(null)} aria-label="내 프로필 보기" >
                                <LuUser size={16} style={styles.menuItemIcon} /> <span style={styles.menuItemText}>내 프로필</span>
                            </Link>
                        </li>
                        <li style={styles.menuItemLi}>
                            <Link to="/settings/account" style={getMenuItemStyle('settings')} onClick={handleClose} onMouseEnter={() => setHoveredItem('settings')} onMouseLeave={() => setHoveredItem(null)} aria-label="계정 설정으로 이동" >
                                <LuSettings size={16} style={styles.menuItemIcon} /> <span style={styles.menuItemText}>계정 설정</span>
                            </Link>
                        </li>
                        <li style={styles.menuItemLi}>
                            <button type="button" style={getMenuItemStyle('logout')} onClick={handleLogoutClick} onMouseEnter={() => setHoveredItem('logout')} onMouseLeave={() => setHoveredItem(null)} aria-label="로그아웃" >
                                <LuLogOut size={16} style={styles.menuItemIcon} /> <span style={styles.menuItemText}>로그아웃</span>
                            </button>
                        </li>
                    </ul>
                </>
            ) : (
                <ul style={styles.menuList}>
                    <li style={styles.menuItemLi}>
                        <button type="button" style={getMenuItemStyle('login')} onClick={handleLoginClick} onMouseEnter={() => setHoveredItem('login')} onMouseLeave={() => setHoveredItem(null)} aria-label="로그인" >
                            <LuLogIn size={16} style={styles.menuItemIcon} /> <span style={styles.menuItemText}>로그인</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default ProfileMenuContent;