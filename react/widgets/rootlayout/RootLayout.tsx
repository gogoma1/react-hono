import { useMemo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useUIStore } from '../../shared/store/uiStore';
// [수정] import 경로 변경
import { useLayoutStore, selectStudentSearchProps, selectRightSidebarConfig } from '../../shared/store/layoutStore'; 
import BackgroundBlobs from '../rootlayout/BackgroundBlobs';
import GlassNavbar from '../rootlayout/GlassNavbar';
import GlassSidebar from '../rootlayout/GlassSidebar';
import GlassSidebarRight from '../rootlayout/GlassSidebarRight';
import TableSearch from '../../features/table-search/ui/TableSearch';
import './RootLayout.css';

const RootLayout = () => {
    const location = useLocation();
    const updateLayoutForPath = useLayoutStore(state => state.updateLayoutForPath);
    
    useEffect(() => {
        updateLayoutForPath(location.pathname);
    }, [location.pathname, updateLayoutForPath]);

    const { 
        currentBreakpoint, 
        mobileSidebarType, 
        closeMobileSidebar, 
        isLeftSidebarExpanded, 
    } = useUIStore();
    
    // [수정] rightSidebar 상태를 한번에 가져옴
    const { content: rightSidebarContent, isExtraWide: isRightSidebarExtraWide } = useLayoutStore(selectRightSidebarConfig);
    const studentSearchProps = useLayoutStore(selectStudentSearchProps);
    
    // [수정] isRightSidebarExpanded는 콘텐츠의 존재 여부로 판단
    const isRightSidebarExpanded = rightSidebarContent !== null;

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
        ${isRightSidebarExtraWide ? 'right-sidebar-extra-wide' : ''}
    `.trim().replace(/\s+/g, ' ');

    const isWorkbenchPage = location.pathname === '/problem-workbench';
    const mainContentClasses = `main-content ${isWorkbenchPage ? 'main-content--compact-padding' : ''}`;

    return (
        <div className={`app-container ${sidebarStateClass} ${showOverlay ? 'mobile-sidebar-active' : ''}`}>
            <div className="background-blobs-wrapper"><BackgroundBlobs /></div>
            
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