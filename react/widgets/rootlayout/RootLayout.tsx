import { useMemo, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore } from '../../shared/store/layoutStore';
import BackgroundBlobs from './BackgroundBlobs';
import GlassNavbar from './GlassNavbar';
import GlassSidebar from './GlassSidebar';
import GlassSidebarRight from './GlassSidebarRight';
import TableSearch from '../../features/table-search/ui/TableSearch';
import './RootLayout.css';

const RootLayout = () => {
    const location = useLocation();
    const { 
      updateLayoutForPath, 
      searchBoxProps,
      rightSidebar: { contentConfig, isExtraWide: isRightSidebarExtraWide }
    } = useLayoutStore();
    
    useEffect(() => {
        updateLayoutForPath(location.pathname);
    }, [location.pathname, updateLayoutForPath]);

    const { 
        currentBreakpoint, 
        mobileSidebarType, 
        closeMobileSidebar, 
        isLeftSidebarExpanded, 
    } = useUIStore();
    
    const [isSearchBoxVisible, setIsSearchBoxVisible] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (searchBoxProps) {
            timer = setTimeout(() => {
                setIsSearchBoxVisible(true);
            }, 20);
        } else {
            setIsSearchBoxVisible(false);
        }
        
        return () => clearTimeout(timer);
    }, [searchBoxProps]);
    
    const isRightSidebarExpanded = contentConfig.type !== null;

    const parsedSuggestionGroups = useMemo(() => {
        if (searchBoxProps?.suggestionGroups) {
            try {
                return JSON.parse(searchBoxProps.suggestionGroups);
            } catch (e) {
                console.error("Failed to parse suggestionGroups JSON", e);
                return [];
            }
        }
        return [];
    }, [searchBoxProps?.suggestionGroups]);
    
    const showOverlay = currentBreakpoint === 'mobile' && mobileSidebarType !== null;

    // [핵심 수정] 현재 경로가 '모바일 시험지' 페이지인지 확인합니다.
    const isMobileExamPage = location.pathname === '/mobile-exam';
    
    // [핵심 수정] isMobileExamPage 값에 따라 조건부 클래스를 추가합니다.
    const appContainerClasses = `
        app-container
        ${isLeftSidebarExpanded ? 'left-sidebar-expanded' : 'left-sidebar-collapsed'}
        ${isRightSidebarExpanded ? 'right-sidebar-expanded' : 'right-sidebar-collapsed'}
        ${isRightSidebarExtraWide ? 'right-sidebar-extra-wide' : ''}
        ${showOverlay ? 'mobile-sidebar-active' : ''}
        ${isMobileExamPage ? 'mobile-exam-layout-active' : ''}
    `.trim().replace(/\s+/g, ' ');

    const isWorkbenchPage = location.pathname === '/problem-workbench';
    const mainContentClasses = `main-content ${isWorkbenchPage ? 'main-content--compact-padding' : ''}`;

    const bottomContentAreaClasses = `
        bottom-content-area 
        ${isSearchBoxVisible ? 'visible' : ''}
    `.trim();

    return (
        <div className={appContainerClasses}>
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

                <div className={bottomContentAreaClasses}>
                    {searchBoxProps && (
                        <TableSearch
                            {...searchBoxProps}
                            suggestionGroups={parsedSuggestionGroups}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default RootLayout;