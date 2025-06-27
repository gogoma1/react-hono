import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router'; // react-router-dom으로 수정
import './GlassNavbar.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useSidebarTriggers } from '../../shared/store/layoutStore';
import { 
    LuLayoutDashboard, LuMenu, LuCircleUserRound, LuCirclePlus, 
    LuSettings2, LuSearch, LuClipboardList, LuBookMarked // [추가] 아이콘 임포트
} from 'react-icons/lu';
import Tippy from '@tippyjs/react';

import GlassPopover from '../../shared/components/GlassPopover';
import ProfileMenuContent from '../../features/popovermenu/ProfileMenuContent';

const LogoIcon = () => <LuLayoutDashboard size={26} className="navbar-logo-icon" />;
const HamburgerIcon = () => <LuMenu size={22} />;
const ProfileIcon = () => <LuCircleUserRound size={22} />;

// [수정] 모든 모바일 액션 아이콘을 컴포넌트로 정의
const RegisterIcon = () => <LuCirclePlus size={22} />;
const SettingsIcon = () => <LuSettings2 size={22} />;
const SearchIcon = () => <LuSearch size={22} />;
const PromptIcon = () => <LuClipboardList size={22} />;
const LatexHelpIcon = () => <LuBookMarked size={22} />;


const GlassNavbar: React.FC = () => {
    const {
        currentBreakpoint,
        toggleLeftSidebar,
        mobileSidebarType,
        closeMobileSidebar,
    } = useUIStore();
    
    // [수정] 모든 종류의 트리거를 가져오도록 수정
    const { 
        registerTrigger, 
        settingsTrigger, 
        searchTrigger, 
        promptTrigger, 
        latexHelpTrigger 
    } = useSidebarTriggers();

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
        // [수정] 훅의 의존성이 변경될 때 불필요한 호출을 막기 위해 조건 추가
        if (isProfilePopoverOpen && currentBreakpoint !== 'desktop') {
            handleCloseProfilePopover();
        }
    }, [currentBreakpoint, isProfilePopoverOpen]); // 의존성 배열 정리

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
                        {/* [수정] 모든 트리거에 대해 버튼을 렌더링하도록 로직 확장 */}
                        {registerTrigger && (
                            <Tippy content={registerTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={registerTrigger.onClick} className="navbar-icon-button" aria-label={registerTrigger.tooltip}>
                                    <RegisterIcon />
                                </button>
                            </Tippy>
                        )}
                        {searchTrigger && (
                             <Tippy content={searchTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={searchTrigger.onClick} className="navbar-icon-button" aria-label={searchTrigger.tooltip}>
                                    <SearchIcon />
                                </button>
                            </Tippy>
                        )}
                        {promptTrigger && (
                             <Tippy content={promptTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={promptTrigger.onClick} className="navbar-icon-button" aria-label={promptTrigger.tooltip}>
                                    <PromptIcon />
                                </button>
                            </Tippy>
                        )}
                        {latexHelpTrigger && (
                             <Tippy content={latexHelpTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={latexHelpTrigger.onClick} className="navbar-icon-button" aria-label={latexHelpTrigger.tooltip}>
                                    <LatexHelpIcon />
                                </button>
                            </Tippy>
                        )}
                        {settingsTrigger && (
                             <Tippy content={settingsTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={settingsTrigger.onClick} className="navbar-icon-button" aria-label={settingsTrigger.tooltip}>
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