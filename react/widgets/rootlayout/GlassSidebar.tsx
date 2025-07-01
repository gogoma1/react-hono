import React from 'react';
import { NavLink } from 'react-router'; // [수정] react-router-dom에서 NavLink import
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/animations/perspective.css';

import './GlassSidebar.css';
import { useUIStore } from '../../shared/store/uiStore';
import {
    LuLayoutDashboard, LuCheck, LuLibrary, LuHeart, LuActivity,
    LuChartBar, LuFileText, LuChevronLeft, LuChevronRight,
    LuMove, LuFile, LuPrinter, LuSmartphone // [복원] 모바일 아이콘 임포트
} from 'react-icons/lu';

interface MenuItemData {
    path: string;
    name: string;
    icon: React.ReactNode;
    isSubItem?: boolean;
    badge?: number;
}

const DashboardIcon = () => <LuLayoutDashboard size={18} />;
const ProblemIcon = () => <LuFile size={18} />;
const ProblemPublishingIcon = () => <LuPrinter size={18} />;
const SmartphoneIcon = () => <LuSmartphone size={18} />; // [복원] 모바일 아이콘 컴포넌트
const MoveIcon = () => <LuMove size={18} />; 
const ActivityIcon = () => <LuActivity size={18} />;
const StatisticIcon = () => <LuChartBar size={18} />;
const PerformanceIcon = () => <LuFileText size={18} />;
const TasksIcon = () => <LuCheck size={18} />;
const LibrariesIcon = () => <LuLibrary size={18} />;
const SavedIcon = () => <LuHeart size={18} />;
const CloseLeftSidebarIcon = () => <LuChevronLeft size={22} />;
const TabletToggleChevronLeftIcon = () => <LuChevronLeft size={20} />;
const TabletToggleChevronRightIcon = () => <LuChevronRight size={20} />;
const JsonIcon = () => <LuFile size={18} />; 

export const allMenuItems: MenuItemData[] = [
     { 
        path: '/dashboard', 
        name: '대시보드', 
        icon: <DashboardIcon /> 
    },
    {
        path: '/problem-workbench',
        name: '문제 작업',
        icon: <ProblemIcon />
    },
    {
        path: '/problem-publishing',
        name: '문제 출제',
        icon: <ProblemPublishingIcon />
    },
    {
        path: '/mobile-exam', // [복원] '모바일 시험지' 메뉴 아이템
        name: '모바일 시험지',
        icon: <SmartphoneIcon />
    },
    {
        path: '/json-renderer',
        name: 'JSON 렌더러',
        icon: <JsonIcon />
    },
];


const GlassSidebar: React.FC = () => {
    const { isLeftSidebarExpanded, mobileSidebarType, currentBreakpoint, toggleLeftSidebar, closeMobileSidebar } = useUIStore();

    let sidebarShouldBeCollapsed = false;
    let isVisibleOnScreen = true;

    if (currentBreakpoint === 'mobile') {
        isVisibleOnScreen = mobileSidebarType === 'left';
        sidebarShouldBeCollapsed = false;
    } else if (currentBreakpoint === 'tablet') {
        sidebarShouldBeCollapsed = !isLeftSidebarExpanded;
    } else { 
        sidebarShouldBeCollapsed = !isLeftSidebarExpanded;
    }

    const handleLinkClick = () => {
        if (currentBreakpoint === 'mobile') {
            closeMobileSidebar();
        }
    };
    

    return (
        <aside className={`glass-sidebar
            ${sidebarShouldBeCollapsed ? 'collapsed' : ''}
            ${currentBreakpoint === 'mobile' ? 'mobile-sidebar left-mobile-sidebar' : ''}
            ${currentBreakpoint === 'mobile' && isVisibleOnScreen ? 'open' : ''}
        `}>
         
            <div className="sidebar-header lgs-header">
                {currentBreakpoint === 'mobile' && (
                    <>
                        <span className="sidebar-header-text">메뉴</span>
                        <Tippy content="닫기" placement="bottom" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                            <button onClick={closeMobileSidebar} className="sidebar-close-button mobile-only lgs-close-btn" aria-label="메뉴 닫기">
                                <CloseLeftSidebarIcon />
                            </button>
                        </Tippy>
                    </>
                )}
                {currentBreakpoint !== 'mobile' && (
                    <>
                        {(!sidebarShouldBeCollapsed) && <span className="sidebar-header-text">MAIN</span>}
                    </>
                )}
            </div>

            {currentBreakpoint === 'tablet' && (
                <div className="tablet-toggle-button-wrapper">
                    <Tippy content={isLeftSidebarExpanded ? "메뉴 축소" : "메뉴 확장"} placement="right" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                        <button
                            onClick={toggleLeftSidebar}
                            className="sidebar-toggle-button left-sidebar-toggle tablet-control"
                            aria-label={isLeftSidebarExpanded ? "메뉴 축소" : "메뉴 확장"}
                        >
                            {isLeftSidebarExpanded ? <TabletToggleChevronLeftIcon /> : <TabletToggleChevronRightIcon />}
                        </button>
                    </Tippy>
                </div>
            )}

            <nav className="sidebar-nav lgs-nav">
                <ul>
                    {allMenuItems.map((item) => {
                        const isMobileView = currentBreakpoint === 'mobile';
                        const showFullText = (!sidebarShouldBeCollapsed || isMobileView);
                        const itemAriaLabel = `${item.name}${item.badge ? `, 알림 ${item.badge}개` : ''}`;

                        return (
                            <li key={item.path} className={`${item.isSubItem ? 'sub-menu-item-li' : ''} ${(sidebarShouldBeCollapsed && !isMobileView) ? 'li-collapsed' : ''}`}>
                                <Tippy
                                    content={item.name}
                                    placement="right"
                                    theme="custom-glass"
                                    animation="perspective"
                                    delay={[350, 0]}
                                    disabled={showFullText} 
                                >
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) => 
                                            `menu-item-link 
                                            ${isActive ? 'active' : ''} 
                                            ${item.isSubItem ? 'sub-menu-item-link' : ''} 
                                            ${(sidebarShouldBeCollapsed && !isMobileView) ? 'link-collapsed' : ''}`
                                        }
                                        onClick={handleLinkClick}
                                        aria-label={itemAriaLabel}
                                    >
                                        <span className="menu-icon-wrapper">{item.icon}</span>
                                        {showFullText && <span className="menu-item-name">{item.name}</span>}
                                        {showFullText && item.badge && (
                                            <span className="notification-badge" aria-label={`알림 ${item.badge}개`}>{item.badge}</span>
                                        )}
                                    </NavLink>
                                </Tippy>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};
export default GlassSidebar;