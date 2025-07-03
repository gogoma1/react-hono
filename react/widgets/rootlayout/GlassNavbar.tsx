import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router'; // [수정] react-router -> react-router-dom
import './GlassNavbar.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, useSidebarTriggers } from '../../shared/store/layoutStore'; 
import { useMobileExamTimeStore } from '../../features/mobile-exam-session/model/mobileExamTimeStore'; // [핵심 수정]
import { 
    LuLayoutDashboard, LuMenu, LuCircleUserRound, LuCirclePlus, 
    LuSettings2, LuSearch, LuClipboardList, LuBookMarked,
} from 'react-icons/lu';
import Tippy from '@tippyjs/react';

import GlassPopover from '../../shared/components/GlassPopover';
import ProfileMenuContent from '../../features/popovermenu/ProfileMenuContent';

const LogoIcon = () => <LuLayoutDashboard size={26} className="navbar-logo-icon" />;
const HamburgerIcon = () => <LuMenu size={22} />;
const ProfileIcon = () => <LuCircleUserRound size={22} />;

const RegisterIcon = () => <LuCirclePlus size={22} />;
const SettingsIcon = () => <LuSettings2 size={22} />;
const SearchIcon = () => <LuSearch size={22} />;
const PromptIcon = () => <LuClipboardList size={22} />;
const LatexHelpIcon = () => <LuBookMarked size={22} />;

const getProgressBarColor = (minute: number): string => {
    if (minute < 1) return '#3498db'; 
    if (minute < 2) return '#2ecc71'; 
    if (minute < 3) return '#f1c40f'; 
    if (minute < 4) return '#e67e22'; 
    return '#c0392b'; 
};


const GlassNavbar: React.FC = () => {
    const location = useLocation();
    const {
        currentBreakpoint,
        toggleLeftSidebar,
        mobileSidebarType,
        closeMobileSidebar,
    } = useUIStore();
    
    const { 
        registerTrigger, 
        settingsTrigger, 
        searchTrigger, 
        promptTrigger, 
        latexHelpTrigger 
    } = useSidebarTriggers();

    const timerDisplay = useLayoutStore(state => state.timerDisplay);
    const currentProblemTimer = useMobileExamTimeStore(state => state.currentTimer); // [핵심 수정]

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
        if (isProfilePopoverOpen && currentBreakpoint !== 'desktop') {
            handleCloseProfilePopover();
        }
    }, [currentBreakpoint, isProfilePopoverOpen]);

    const renderMobileExamTimer = () => {
        const isVisible = location.pathname === '/mobile-exam' && currentProblemTimer >= 0;
        if (!isVisible) return null;

        const currentMinute = Math.floor(currentProblemTimer / 60);
        const secondsIntoMinute = currentProblemTimer % 60;
        const progressPercentage = (secondsIntoMinute / 60) * 100;
        const minuteText = `${currentMinute + 1}분`;
        const barColor = getProgressBarColor(currentMinute);

        return (
            <div className="timer-progress-bar-container">
                <div className="progress-bar-track">
                    <div 
                        className="progress-bar-fill"
                        style={{ 
                            width: `${progressPercentage}%`, 
                            backgroundColor: barColor 
                        }}
                    />
                </div>
                <span className="progress-minute-text">{minuteText}</span>
            </div>
        );
    };

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

                {location.pathname === '/mobile-exam' && renderMobileExamTimer()}
            </div>
            
            <div className="navbar-center">
                {location.pathname !== '/mobile-exam' && timerDisplay?.isVisible && (
                    <div className="navbar-timer">
                        <span className="timer-text">{timerDisplay.text}</span>
                    </div>
                )}
            </div>

            <div className="navbar-right">
                {currentBreakpoint === 'mobile' && (
                    <div className="mobile-right-actions">
                        {registerTrigger?.onClick && (
                            <Tippy content={registerTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={registerTrigger.onClick} className="navbar-icon-button" aria-label={registerTrigger.tooltip}>
                                    <RegisterIcon />
                                </button>
                            </Tippy>
                        )}
                        {searchTrigger?.onClick && (
                             <Tippy content={searchTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={searchTrigger.onClick} className="navbar-icon-button" aria-label={searchTrigger.tooltip}>
                                    <SearchIcon />
                                </button>
                            </Tippy>
                        )}
                        {promptTrigger?.onClick && (
                             <Tippy content={promptTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={promptTrigger.onClick} className="navbar-icon-button" aria-label={promptTrigger.tooltip}>
                                    <PromptIcon />
                                </button>
                            </Tippy>
                        )}
                        {latexHelpTrigger?.onClick && (
                             <Tippy content={latexHelpTrigger.tooltip} placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={latexHelpTrigger.onClick} className="navbar-icon-button" aria-label={latexHelpTrigger.tooltip}>
                                    <LatexHelpIcon />
                                </button>
                            </Tippy>
                        )}
                        {settingsTrigger?.onClick && (
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