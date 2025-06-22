import React from 'react';
import { useLocation } from 'react-router';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectRightSidebarContent, selectSidebarTriggers } from '../../shared/store/layoutStore';
import { LuSettings2, LuChevronRight, LuCircleX, LuCirclePlus } from 'react-icons/lu';

const SettingsIcon = () => <LuSettings2 size={20} />;
const CloseRightSidebarIcon = () => <LuChevronRight size={22} />;
const CloseIcon = () => <LuCircleX size={22} />;
const PlusIcon = () => <LuCirclePlus size={22} />;

const GlassSidebarRight: React.FC = () => {
    const location = useLocation();
    const rightSidebarContent = useLayoutStore(selectRightSidebarContent);
    const { onRegisterClick, onSettingsClick, onClose } = useLayoutStore(selectSidebarTriggers);
    
    // [수정] 토글 오류 해결을 위해 `closeMobileSidebar` 직접 호출 대신 `onClose` 트리거 사용
    const { isRightSidebarExpanded, mobileSidebarType, currentBreakpoint } = useUIStore();
    
    const isDashboardPage = location.pathname.startsWith('/dashboard');

    const isOpen = currentBreakpoint === 'mobile' ? mobileSidebarType === 'right' : isRightSidebarExpanded;

    return (
        <aside className={`glass-sidebar-right ${isOpen ? 'expanded' : ''} ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''} ${isOpen ? 'open' : ''}`}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
                    {isRightSidebarExpanded ? (
                        <Tippy content="닫기" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                            <button onClick={onClose} className="settings-toggle-button active" aria-label="사이드바 닫기">
                                <CloseIcon />
                            </button>
                        </Tippy>
                    ) : (
                        <>
                            <Tippy content="신입생 등록" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                <button onClick={onRegisterClick} className="settings-toggle-button" aria-label="신입생 등록">
                                    <PlusIcon />
                                </button>
                            </Tippy>
                            
                            {isDashboardPage && (
                                <Tippy content="테이블 설정" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={onSettingsClick}
                                        className="settings-toggle-button"
                                        aria-label="테이블 컬럼 설정"
                                    >
                                        <SettingsIcon />
                                    </button>
                                </Tippy>
                            )}
                        </>
                    )}
                </div>
            )}
            
            {isOpen && (
                <div className="expanded-content-area rgs-content">
                     {currentBreakpoint === 'mobile' && (
                        <div className="sidebar-header rgs-mobile-header">
                            <Tippy content="닫기" placement="bottom" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                                {/* [수정] onClick 핸들러를 uiStore의 closeMobileSidebar 직접 호출에서 layoutStore의 onClose 트리거로 변경 */}
                                <button onClick={onClose} className="sidebar-close-button mobile-only rgs-close-btn" aria-label="닫기">
                                    <CloseRightSidebarIcon />
                                </button>
                            </Tippy>
                        </div>
                     )}
                    
                    {rightSidebarContent}
                </div>
            )}
        </aside>
    );
};

export default GlassSidebarRight;