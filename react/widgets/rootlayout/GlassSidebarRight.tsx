import React, { useState } from 'react';
import { useLocation } from 'react-router';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectRightSidebarContent } from '../../shared/store/layoutStore';
import { LuSettings2, LuChevronRight } from 'react-icons/lu';
import TableColumnToggler from '../../features/table-column-toggler/ui/TableColumnToggler';

const SettingsIcon = () => <LuSettings2 size={20} />;
const CloseRightSidebarIcon = () => <LuChevronRight size={22} />;

const GlassSidebarRight: React.FC = () => {
    const location = useLocation();
    const rightSidebarContent = useLayoutStore(selectRightSidebarContent);
    const rightSidebarTrigger = useLayoutStore((state) => state.rightSidebarTrigger);
    
    const { isRightSidebarExpanded, setRightSidebarExpanded, mobileSidebarType, currentBreakpoint, closeMobileSidebar } = useUIStore();
    
    const [isSettingsPanelOpen, setSettingsPanelOpen] = useState(false);

    const hasContent = rightSidebarContent !== null;
    const isDashboardPage = location.pathname.startsWith('/dashboard');

    const isActuallyExpanded = (currentBreakpoint !== 'mobile' && ( (isRightSidebarExpanded && hasContent) || isSettingsPanelOpen)) 
        || (currentBreakpoint === 'mobile' && mobileSidebarType === 'right' && hasContent);

    const isOpen = currentBreakpoint === 'mobile' ? (mobileSidebarType === 'right' && hasContent) : isActuallyExpanded;

    const handleToggleSettingsPanel = () => {
        if (isRightSidebarExpanded) {
            setRightSidebarExpanded(false);
        }
        setSettingsPanelOpen(prev => !prev);
    };

    return (
        <aside className={`glass-sidebar-right ${isActuallyExpanded ? 'expanded' : ''} ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''} ${isOpen ? 'open' : ''}`}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
                    {/* [핵심 수정] 신입생 등록 버튼이 항상 아래에 오도록 순서 변경 및 div 래퍼 제거 */}
                    {rightSidebarTrigger}

                    {isDashboardPage && (
                        <Tippy content="테이블 설정" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                            <button
                                onClick={handleToggleSettingsPanel}
                                className={`settings-toggle-button ${isSettingsPanelOpen ? 'active' : ''}`}
                                aria-label="테이블 컬럼 설정"
                                aria-expanded={isSettingsPanelOpen}
                            >
                                <SettingsIcon />
                            </button>
                        </Tippy>
                    )}
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
                    
                    {isSettingsPanelOpen 
                        ? <TableColumnToggler /> 
                        : rightSidebarContent
                    }
                </div>
            )}
        </aside>
    );
};

export default GlassSidebarRight;