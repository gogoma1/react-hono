import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import './GlassNavbar.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore } from '../../shared/store/layoutStore';
import { LuLayoutDashboard, LuMenu, LuCircleUserRound, LuCirclePlus } from 'react-icons/lu';
import Tippy from '@tippyjs/react';

import GlassPopover from '../../shared/components/GlassPopover';
import ProfileMenuContent from '../../features/popovermenu/ProfileMenuContent';

const LogoIcon = () => <LuLayoutDashboard size={26} className="navbar-logo-icon" />;
const HamburgerIcon = () => <LuMenu size={22} />;
const ProfileIcon = () => <LuCircleUserRound size={22} />;
const DefaultSettingsIcon = () => <LuCirclePlus size={22} />;

const GlassNavbar: React.FC = () => {
    const {
        currentBreakpoint,
        toggleLeftSidebar,
        mobileSidebarType,
        closeMobileSidebar,
    } = useUIStore();
    
    // [수정] rightSidebarTrigger의 타입을 명확히 단언
    const rightSidebarTrigger = useLayoutStore((state) => state.rightSidebarTrigger) as React.ReactElement<{ className?: string; disabled?: boolean; }> | null;

    const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        {React.isValidElement(rightSidebarTrigger) ? (
                            React.cloneElement(rightSidebarTrigger, {
                                className: `${rightSidebarTrigger.props.className || ''} mobile-nav-trigger`,
                                disabled: true, // 모바일에서 툴팁 비활성화
                            })
                        ) : (
                            <Tippy content="설정" placement="bottom-end" theme="custom-glass" delay={[300, 0]}>
                                <button className="navbar-icon-button" aria-label="설정">
                                    <DefaultSettingsIcon />
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