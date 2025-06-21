 // filepath: react-hono/react/widgets/rootlayout/GlassSidebar.tsx
import React from 'react';
// [수정 1] react-router-dom에서 NavLink import
import { NavLink } from 'react-router'; 
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // Tippy 기본 스타일 (필요시)
import 'tippy.js/themes/light.css'; // Tippy 테마 (필요시, custom-glass 테마 CSS가 있다면 불필요할 수 있음)
import 'tippy.js/animations/perspective.css'; // Tippy 애니메이션 (필요시)

import './GlassSidebar.css';
import { useUIStore } from '../../shared/store/uiStore'; // UI 상태 관리 스토어 import 경로 확인
import {
     // 아이콘 import 업데이트
    LuLayoutDashboard, LuCheck, LuLibrary, LuHeart, LuActivity,
    LuChartBar, LuFileText, LuChevronLeft, LuChevronRight,
    LuTestTubes, LuMove, LuFile // 추가 아이콘
} from 'react-icons/lu';

interface MenuItemData {
    path: string;
    name: string;
    icon: React.ReactNode;
    isSubItem?: boolean;
    badge?: number;
}

// --- 아이콘 컴포넌트 정의 (변경 없음) ---
const DashboardIcon = () => <LuLayoutDashboard size={18} />;
const ProblemIcon = () => <LuFile size={18} />;
// 예제 및 테스트용 아이콘 추가/수정
const ExampleIcon = () => <LuTestTubes size={18} />; 
const MoveIcon = () => <LuMove size={18} />; 
// 기존 아이콘 유지 (향후 사용 대비)
const ActivityIcon = () => <LuActivity size={18} />;
const StatisticIcon = () => <LuChartBar size={18} />;
const PerformanceIcon = () => <LuFileText size={18} />;
const TasksIcon = () => <LuCheck size={18} />;
const LibrariesIcon = () => <LuLibrary size={18} />;
const SavedIcon = () => <LuHeart size={18} />;
const CloseLeftSidebarIcon = () => <LuChevronLeft size={22} />;
const TabletToggleChevronLeftIcon = () => <LuChevronLeft size={20} />;
const TabletToggleChevronRightIcon = () => <LuChevronRight size={20} />;

// [수정 2] 현재 App.tsx 의 RootLayout 내부에 정의된 Route path 기준으로 메뉴 구성
// 경로는 /dashboard, /exampleget, /move 입니다. 
// '/' 경로는 HomePage이며 RootLayout 바깥에 있으므로 사이드바 메뉴에 포함되지 않습니다.
export const allMenuItems: MenuItemData[] = [
     { 
        path: '/dashboard', // 현재 App.tsx 구조상 대시보드 경로는 /dashboard 입니다.
        name: '대시보드', 
        icon: <DashboardIcon /> 
    },
    {
        path: '/problem-workbench', // 새 페이지의 URL 경로
        name: '문제 작업',
        icon: <ProblemIcon />
    },
   
     { 
        path: '/exampleget', 
        name: 'DB 예제', 
        icon: <ExampleIcon /> 
    },
    // 기존 메뉴 주석 처리 (App.tsx에 라우트 추가 후 주석 해제)
    // { path: '/studenttabletest', name: '테이블테스트', icon: <TasksIcon />, badge: 5 },
    // { path: '/students', name: '학생관리', icon: <LibrariesIcon /> },
    // { path: '/mystudentpage', name: 'API테스트', icon: <SavedIcon /> },
];


// --- 컴포넌트 로직 (allMenuItems 사용 부분 외 변경 없음) ---
const GlassSidebar: React.FC = () => {
    const { isLeftSidebarExpanded, mobileSidebarType, currentBreakpoint, toggleLeftSidebar, closeMobileSidebar } = useUIStore();

    let sidebarShouldBeCollapsed = false;
    // isVisibleOnScreen은 이 컴포넌트가 화면에 실제로 보여야 하는지 여부 (모바일에서는 mobileSidebarType으로 결정)
    let isVisibleOnScreen = true;

    if (currentBreakpoint === 'mobile') {
        isVisibleOnScreen = mobileSidebarType === 'left';
        sidebarShouldBeCollapsed = false; // 모바일에서는 항상 확장된 형태
    } else if (currentBreakpoint === 'tablet') {
        sidebarShouldBeCollapsed = !isLeftSidebarExpanded;
    } else { // desktop
        sidebarShouldBeCollapsed = !isLeftSidebarExpanded;
    }

    const handleLinkClick = () => {
        // 모바일 환경에서 링크 클릭 시 사이드바 닫기
        if (currentBreakpoint === 'mobile') {
            closeMobileSidebar();
        }
    };
    
     // 모바일 환경이지만 왼쪽 사이드바가 열린 상태가 아니라면,
     // CSS 트랜지션을 위해 DOM에는 존재하되 'open' 클래스 없이 렌더링됩니다.
     // return null을 하면 트랜지션 효과를 줄 수 없습니다.

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
                 {/* 데스크탑/태블릿 헤더 */}
                {currentBreakpoint !== 'mobile' && (
                    <>
                        {/* 접힌 상태가 아닐 때만 텍스트 표시 */}
                        {(!sidebarShouldBeCollapsed) && <span className="sidebar-header-text">MAIN</span>}
                    </>
                )}
            </div>

            {/* 태블릿 전용 토글 버튼 */}
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
                    {/* 수정된 allMenuItems 배열을 순회 */}
                    {allMenuItems.map((item) => {
                        const isMobileView = currentBreakpoint === 'mobile';
                        // 모바일 뷰이거나, 사이드바가 접히지 않은 상태면 텍스트 표시
                        const showFullText = (!sidebarShouldBeCollapsed || isMobileView);
                        const itemAriaLabel = `${item.name}${item.badge ? `, 알림 ${item.badge}개` : ''}`;

                        return (
                            <li key={item.path} className={`${item.isSubItem ? 'sub-menu-item-li' : ''} ${(sidebarShouldBeCollapsed && !isMobileView) ? 'li-collapsed' : ''}`}>
                                {/* 텍스트가 보일 때는 툴팁 비활성화 */}
                                <Tippy
                                    content={item.name}
                                    placement="right"
                                    theme="custom-glass" // CSS에 .tippy-box[data-theme~='custom-glass'] 정의 필요
                                    animation="perspective"
                                    delay={[350, 0]}
                                    disabled={showFullText} 
                                >
                                    <NavLink
                                        to={item.path}
                                         // NavLink는 현재 경로와 to 속성이 일치하면 자동으로 'active' 클래스를 부여
                                        className={({ isActive }) => 
                                            `menu-item-link 
                                            ${isActive ? 'active' : ''} 
                                            ${item.isSubItem ? 'sub-menu-item-link' : ''} 
                                            ${(sidebarShouldBeCollapsed && !isMobileView) ? 'link-collapsed' : ''}`
                                        }
                                        onClick={handleLinkClick}
                                        aria-label={itemAriaLabel}
                                          // 서브 메뉴의 경우, end 속성을 추가하여 부모 경로 활성 시 함께 활성화되는 것을 방지할 수 있음
                                          // end={item.isSubItem} 
                                    >
                                        <span className="menu-icon-wrapper">{item.icon}</span>
                                        {/* 텍스트와 뱃지는 showFullText 조건일 때만 표시 */}
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