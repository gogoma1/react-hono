import React from 'react';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectRightSidebarContent } from '../../shared/store/layoutStore';
// [수정] 기본 아이콘과 커스텀 아이콘을 모두 사용하므로 import는 유지
import { LuSettings2, LuChevronRight } from 'react-icons/lu';

const SettingsIcon = () => <LuSettings2 size={20} />;
const CloseRightSidebarIcon = () => <LuChevronRight size={22} />;

const GlassSidebarRight: React.FC = () => {
    const rightSidebarContent = useLayoutStore(selectRightSidebarContent);
    // [수정] 커스텀 트리거 상태를 가져옵니다.
    const rightSidebarTrigger = useLayoutStore((state) => state.rightSidebarTrigger);
    
    const { isRightSidebarExpanded, mobileSidebarType, currentBreakpoint, toggleRightSidebar, closeMobileSidebar } = useUIStore();

    const hasContent = rightSidebarContent !== null;
    const isActuallyExpanded = (currentBreakpoint !== 'mobile' && isRightSidebarExpanded && hasContent) || (currentBreakpoint === 'mobile' && mobileSidebarType === 'right' && hasContent);
    const isOpen = currentBreakpoint === 'mobile' ? (mobileSidebarType === 'right' && hasContent) : isActuallyExpanded;
    const tooltipContent = isActuallyExpanded ? "패널 축소" : "추가 옵션";

    return (
        <aside className={`glass-sidebar-right ${isActuallyExpanded ? 'expanded' : ''} ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''} ${isOpen ? 'open' : ''}`}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
                    {/* ▼▼▼▼▼ [핵심] 조건부 렌더링 로직 ▼▼▼▼▼ */}
                    {rightSidebarTrigger ? (
                        // 1. 커스텀 트리거가 있으면 그것을 렌더링
                        rightSidebarTrigger
                    ) : (
                        // 2. 없으면 기본 설정 버튼을 렌더링
                        <Tippy content={tooltipContent} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                            <button
                                onClick={toggleRightSidebar}
                                className="settings-toggle-button"
                                aria-label={tooltipContent}
                                aria-expanded={isActuallyExpanded}
                                disabled={!hasContent} 
                            >
                                <SettingsIcon />
                            </button>
                        </Tippy>
                    )}
                    {/* ▲▲▲▲▲ [핵심] 로직 끝 ▲▲▲▲▲ */}
                </div>
            )}
            
            {isOpen && (
                <div className="expanded-content-area rgs-content">
                     {currentBreakpoint === 'mobile' && (
                        <div className="sidebar-header rgs-mobile-header">
                            <Tippy content="닫기" placement="bottom" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                                <button onClick={closeMobileSidebar} className="sidebar-close-button mobile-only rgs-close-btn" aria-label="닫기">
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