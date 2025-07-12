// ./react/widgets/rootlayout/GlassSidebar.tsx

import React from 'react';
import { NavLink } from 'react-router';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light.css';
import 'tippy.js/animations/perspective.css';

import './GlassSidebar.css';
import { useUIStore } from '../../shared/store/uiStore';
import {
    LuLayoutDashboard,
    LuChevronLeft, LuChevronRight,
    LuFile, LuPrinter, LuFileJson2, LuFileClock
} from 'react-icons/lu';
// [추가] 새로 만든 동적 링크 컴포넌트를 import 합니다.
import MobileExamsNavLink from '../../features/conditional-nav/ui/MobileExamsNavLink';

// [수정] MenuItemData 타입을 export하여 다른 파일에서 재사용할 수 있게 합니다.
export interface MenuItemData {
    path: string;
    name: string;
    icon: React.ReactNode;
    isSubItem?: boolean;
    badge?: number;
}

const DashboardIcon = () => <LuLayoutDashboard size={18} />;
const ProblemIcon = () => <LuFile size={18} />;
const ProblemPublishingIcon = () => <LuPrinter size={18} />;
const JsonIcon = () => <LuFileJson2 size={18} />; 
const PublishedExamsIcon = () => <LuFileClock size={18} />;

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
        // 경로는 이제 동적으로 결정되므로, 여기서는 고유한 식별자 역할만 합니다.
        path: '/published-exams', 
        name: '모바일 시험지 목록',
        icon: <PublishedExamsIcon />,
    },
    {
        path: '/problem-sets/create',
        name: '문제집 제작',
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
                                <LuChevronLeft size={22} />
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
                            {isLeftSidebarExpanded ? <LuChevronLeft size={20} /> : <LuChevronRight size={20} />}
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

                        // --- [핵심 수정] ---
                        // '모바일 시험지 목록' 메뉴일 경우, 새로 만든 동적 링크 컴포넌트를 렌더링합니다.
                        if (item.name === '모바일 시험지 목록') {
                            return (
                                <MobileExamsNavLink
                                    key={item.path}
                                    item={item}
                                    isCollapsed={sidebarShouldBeCollapsed && !isMobileView}
                                    onLinkClick={handleLinkClick}
                                />
                            );
                        }
                        // --- 수정 끝 ---

                        // 나머지 메뉴들은 기존 방식 그대로 렌더링합니다.
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