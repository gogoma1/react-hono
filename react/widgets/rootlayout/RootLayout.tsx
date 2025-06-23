import { useMemo, useEffect } from 'react'; // useEffect 추가
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
    const updateLayoutForPath = useLayoutStore(state => state.updateLayoutForPath);
    
    // [핵심] location.pathname이 바뀔 때마다 스토어에 알려서 레이아웃 설정을 업데이트합니다.
    useEffect(() => {
        updateLayoutForPath(location.pathname);
    }, [location.pathname, updateLayoutForPath]);

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