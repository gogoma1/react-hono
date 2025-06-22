import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router'; // useLocation import
import './GlassNavbar.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectSidebarTriggers } from '../../shared/store/layoutStore';
import { LuLayoutDashboard, LuMenu, LuCircleUserRound, LuCirclePlus, LuSettings2 } from 'react-icons/lu';
import Tippy from '@tippyjs/react';

import GlassPopover from '../../shared/components/GlassPopover';
import ProfileMenuContent from '../../features/popovermenu/ProfileMenuContent';

const LogoIcon = () => <LuLayoutDashboard size={26} className="navbar-logo-icon" />;
const HamburgerIcon = () => <LuMenu size={22} />;
const ProfileIcon = () => <LuCircleUserRound size={22} />;
const RegisterIcon = () => <LuCirclePlus size={22} />;
const SettingsIcon = () => <LuSettings2 size={22} />;

const GlassNavbar: React.FC = () => {
    const location = useLocation(); // [추가]
    const {
        currentBreakpoint,
        toggleLeftSidebar,
        mobileSidebarType,
        closeMobileSidebar,
    } = useUIStore();
    
    const { onRegisterClick, onSettingsClick } = useLayoutStore(selectSidebarTriggers);

    const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);
    
    // [추가] 대시보드 페이지인지 확인
    const isDashboardPage = location.pathname.startsWith('/dashboard');

    const handleProfileButtonClick = () => {
        if (currentBreakpoint === 'mobile' && mobileSidebarType && !isProfilePopoverOpen) {
            closeMobileSidebar();
        }
        setIsProfilePopoverOpen(prev => !prev);
    };

    const handleCloseProfilePopover = () => {
        setIsProfilePopoverOpen(false);
    };

    useEffect(() => {
        if (isProfilePopoverOpen) {
            handleCloseProfilePopover();
        }
    }, [currentBreakpoint]);

    return (
        <nav className="glass-navbar">
            <div className="navbar-left">
                {currentBreakpoint === 'mobile' && (
                    <Tippy content="메뉴" placement="bottom-start" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                        <button
                            className={`navbar-icon-button hamburger-button ${isProfilePopoverOpen && currentBreakpoint === 'mobile' ? '' : (mobileSidebarType === 'left' ? 'active' : '')}`}
                            onClick={toggleLeftSidebar}
                            aria-label="메인 메뉴"
                            aria-expanded={mobileSidebarType === 'left'}
                        >
                            <HamburgerIcon />
                        </button>
                    </Tippy>
                )}
                <Link to="/dashboard" className="navbar-logo-link" aria-label="대시보드로 이동">
                    <LogoIcon />
                </Link>
            </div>

            <div className="navbar-right">
                {currentBreakpoint === 'mobile' && (
                    <div className="mobile-right-actions">
                        {onRegisterClick && (
                            <Tippy content="신입생 등록" placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={onRegisterClick} className="navbar-icon-button" aria-label="신입생 등록">
                                    <RegisterIcon />
                                </button>
                            </Tippy>
                        )}
                        {/* [수정] 대시보드 페이지이고, onSettingsClick 함수가 있을 때만 버튼 렌더링 */}
                        {isDashboardPage && onSettingsClick && (
                             <Tippy content="테이블 설정" placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={onSettingsClick} className="navbar-icon-button" aria-label="테이블 설정">
                                    <SettingsIcon />
                                </button>
                            </Tippy>
                        )}
                    </div>
                )}

                <button
                    ref={profileButtonRef}
                    className={`profile-button navbar-icon-button ${isProfilePopoverOpen ? 'active' : ''}`}
                    aria-label="프로필 메뉴 열기/닫기"
                    onClick={handleProfileButtonClick}
                    aria-expanded={isProfilePopoverOpen}
                >
                    <ProfileIcon />
                </button>

                <GlassPopover
                    isOpen={isProfilePopoverOpen}
                    onClose={handleCloseProfilePopover}
                    anchorEl={profileButtonRef.current}
                    placement="bottom-end"
                    offsetY={10}
                >
                    <ProfileMenuContent onClose={handleCloseProfilePopover} />
                </GlassPopover>
            </div>
        </nav>
    );
};

export default GlassNavbar;