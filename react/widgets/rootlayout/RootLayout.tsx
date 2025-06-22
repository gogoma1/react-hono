import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectStudentSearchProps } from '../../shared/store/layoutStore';
import BackgroundBlobs from '../rootlayout/BackgroundBlobs';
import GlassNavbar from '../rootlayout/GlassNavbar';
import GlassSidebar from '../rootlayout/GlassSidebar';
import GlassSidebarRight from '../rootlayout/GlassSidebarRight';
import TableSearch from '../../features/table-search/ui/TableSearch';
import './RootLayout.css';

const RootLayout = () => {
    const location = useLocation();
    const { 
        currentBreakpoint, 
        mobileSidebarType, 
        closeMobileSidebar, 
        isLeftSidebarExpanded, 
        isRightSidebarExpanded 
    } = useUIStore();
    const studentSearchProps = useLayoutStore(selectStudentSearchProps);

    const parsedSuggestionGroups = useMemo(() => {
        if (studentSearchProps?.suggestionGroups) {
            try {
                return JSON.parse(studentSearchProps.suggestionGroups);
            } catch (e) {
                console.error("Failed to parse suggestionGroups JSON", e);
                return [];
            }
        }
        return [];
    }, [studentSearchProps?.suggestionGroups]);

    const showOverlay = currentBreakpoint === 'mobile' && mobileSidebarType !== null;
    
    const sidebarStateClass = `
        ${isLeftSidebarExpanded ? 'left-sidebar-expanded' : 'left-sidebar-collapsed'}
        ${isRightSidebarExpanded ? 'right-sidebar-expanded' : 'right-sidebar-collapsed'}
    `.trim();

    const isWorkbenchPage = location.pathname === '/problem-workbench';
    const mainContentClasses = `main-content ${isWorkbenchPage ? 'main-content--compact-padding' : ''}`;

    return (
        // [수정] mobile-sidebar-active 클래스를 RootLayout이 아닌 app-container에 적용
        <div className={`app-container ${sidebarStateClass} ${showOverlay ? 'mobile-sidebar-active' : ''}`}>
            <div className="background-blobs-wrapper"><BackgroundBlobs /></div>
            
            {/* 
              [핵심 수정] 
              오버레이를 layout-main-wrapper 안으로 이동시킵니다.
              이렇게 하면 오버레이가 사이드바(z-index: 110) 아래, 메인 콘텐츠(z-index: 5) 위에 위치하게 되어
              사이드바는 블러 처리되지 않고 메인 콘텐츠만 블러 처리됩니다.
            */}
            
            {currentBreakpoint === 'mobile' && <GlassSidebar />}
            {currentBreakpoint === 'mobile' && <GlassSidebarRight />}
            
            <div className={`layout-main-wrapper ${currentBreakpoint}-layout`}>
                {showOverlay && (<div className={`clickable-overlay active`} onClick={closeMobileSidebar} aria-hidden="true" />)}
                <GlassNavbar />
                <div className="content-body-wrapper">
                    {currentBreakpoint !== 'mobile' && <GlassSidebar />}
                    
                    <main className={mainContentClasses}>
                        <Outlet />
                    </main>

                    {currentBreakpoint !== 'mobile' && <GlassSidebarRight />}
                </div>

                {studentSearchProps && (
                    <div className="bottom-content-area">
                        <TableSearch
                            {...studentSearchProps}
                            suggestionGroups={parsedSuggestionGroups}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RootLayout;