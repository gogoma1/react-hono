import React from 'react';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
// 🌟 [1/3] Zustand 스토어와 셀렉터를 임포트합니다.
import { useLayoutStore, selectRightSidebarContent } from '../../shared/store/layoutStore';
import { LuSettings2, LuChevronRight } from 'react-icons/lu';

const SettingsIcon = () => <LuSettings2 size={20} />;
const CloseRightSidebarIcon = () => <LuChevronRight size={22} />;

const GlassSidebarRight: React.FC = () => {
    // 🌟 [2/3] 셀렉터를 사용하여 스토어에서 필요한 상태만 가져옵니다.
    // 이렇게 하면 rightSidebarContent가 변경될 때만 이 컴포넌트가 리렌더링됩니다.
    const rightSidebarContent = useLayoutStore(selectRightSidebarContent);
    
    const { 
        isRightSidebarExpanded, 
        mobileSidebarType, 
        currentBreakpoint, 
        toggleRightSidebar, 
        closeMobileSidebar 
    } = useUIStore();

    const hasContent = rightSidebarContent !== null;
    let isVisibleOnScreen = false;
    let isActuallyExpanded = false;

    if (currentBreakpoint === 'mobile') {
        isVisibleOnScreen = mobileSidebarType === 'right' && hasContent;
        isActuallyExpanded = hasContent;
    } else {
        isVisibleOnScreen = true;
        isActuallyExpanded = isRightSidebarExpanded && hasContent;
    }
    
    // 모바일에서는 hasContent만으로 open 여부 결정, 데스크탑/태블릿에서는 isActuallyExpanded로 결정
    const isOpen = currentBreakpoint === 'mobile' ? (mobileSidebarType === 'right' && hasContent) : isActuallyExpanded;

    const tooltipContent = isActuallyExpanded ? "패널 축소" : "추가 옵션";

    return (
        <aside className={`glass-sidebar-right
            ${isActuallyExpanded ? 'expanded' : ''}
            ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''}
            ${isOpen ? 'open' : ''}
        `}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
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
                </div>
            )}
            
            {/* 🌟 [3/3] 스토어에서 받은 콘텐츠를 렌더링합니다. */}
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