import React, { useState, useRef, useEffect } from 'react'; // useEffect 추가 (선택적: 초기화 등)
import { Link } from 'react-router';
import './GlassNavbar.css';
import { useUIStore } from '../../shared/store/uiStore'; // 경로 확인
import { LuLayoutDashboard, LuMenu, LuSettings2, LuCircleUserRound } from 'react-icons/lu';
import Tippy from '@tippyjs/react'

// Popover 및 내부 콘텐츠 컴포넌트 임포트
import GlassPopover from '../../shared/components/GlassPopover'; // 경로 확인
import ProfileMenuContent from '../../features/popovermenu/ProfileMenuContent'; // 알려주신 경로로 수정

// 아이콘 컴포넌트 정의
const LogoIcon = () => <LuLayoutDashboard size={26} className="navbar-logo-icon" />;
const HamburgerIcon = () => <LuMenu size={22} />;
const SettingsIconMobile = () => <LuSettings2 size={20} />;
const ProfileIcon = () => <LuCircleUserRound size={22} />;

const GlassNavbar: React.FC = () => {
    const {
        currentBreakpoint,
        toggleLeftSidebar,
        toggleRightSidebar,
        mobileSidebarType,
        closeMobileSidebar, // 모바일 사이드바 닫기 함수 (Popover 열 때 필요할 수 있음)
    } = useUIStore();

    // Popover 상태 관리
    const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null); // Popover의 기준점이 될 버튼 ref

    const handleProfileButtonClick = () => {
        // Popover를 열 때, 만약 모바일 사이드바가 열려 있다면 닫아주는 로직 (선택적 UX 개선)
        if (currentBreakpoint === 'mobile' && mobileSidebarType && !isProfilePopoverOpen) {
            closeMobileSidebar();
        }
        setIsProfilePopoverOpen(prev => !prev);
    };

    const handleCloseProfilePopover = () => {
        setIsProfilePopoverOpen(false);
    };

    // (선택적) 화면 크기 변경 시 Popover 닫기
    useEffect(() => {
        if (isProfilePopoverOpen) {
            handleCloseProfilePopover();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentBreakpoint]);


    // Tippy.js는 간단한 툴팁용으로 남겨두고, 프로필 버튼은 커스텀 Popover 사용
    // 만약 Tippy.js를 사용하지 않는다면 해당 import 제거 가능

    return (
        <nav className="glass-navbar">
            <div className="navbar-left">
                {currentBreakpoint === 'mobile' && (
                    <Tippy content="메뉴" placement="bottom-start" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                        <button
                            className={`navbar-icon-button hamburger-button ${isProfilePopoverOpen && currentBreakpoint === 'mobile' ? '' : (mobileSidebarType === 'left' ? 'active' : '')}`} // Popover 열렸을 땐 active 해제
                            onClick={toggleLeftSidebar}
                            aria-label="메인 메뉴"
                            aria-expanded={mobileSidebarType === 'left'}
                        >
                            <HamburgerIcon />
                        </button>
                    </Tippy>
                )}
                {(currentBreakpoint !== 'mobile' || !mobileSidebarType) && (
                    <Link to="/dashboard" className="navbar-logo-link" aria-label="대시보드로 이동">
                        <LogoIcon />
                    </Link>
                )}
            </div>

            <div className="navbar-right">
                {currentBreakpoint === 'mobile' && (
                    <Tippy content="설정" placement="bottom-end" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                        <button
                            className={`navbar-icon-button settings-button-mobile ${isProfilePopoverOpen && currentBreakpoint === 'mobile' ? '' : (mobileSidebarType === 'right' ? 'active' : '')}`} // Popover 열렸을 땐 active 해제
                            onClick={toggleRightSidebar}
                            aria-label="설정"
                            aria-expanded={mobileSidebarType === 'right'}
                        >
                            <SettingsIconMobile />
                        </button>
                    </Tippy>
                )}

                {/* 프로필 버튼과 Popover */}
                <button
                    ref={profileButtonRef}
                    className={`profile-button navbar-icon-button ${isProfilePopoverOpen ? 'active' : ''}`} // Popover 열렸을 때 버튼 active 스타일
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
                    offsetY={10} // 버튼과의 세로 간격
                >
                    {/* ProfileMenuContent에 onClose를 전달하여 내부에서 Popover를 닫을 수 있도록 함 */}
                    <ProfileMenuContent onClose={handleCloseProfilePopover} />
                </GlassPopover>
            </div>
        </nav>
    );
};

export default GlassNavbar;