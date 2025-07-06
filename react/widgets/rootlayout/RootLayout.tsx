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
      // [수정] content를 바로 가져오지 않고, rightSidebar 객체 전체를 가져옵니다.
      rightSidebar
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
    
    // [핵심 수정] 옵셔널 체이닝(?.')을 사용하여 안전하게 type에 접근합니다.
    const isRightSidebarExpanded = rightSidebar?.content?.type !== 'closed';
    const isRightSidebarExtraWide = rightSidebar?.isExtraWide ?? false;

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

    const isMobileExamPage = location.pathname === '/mobile-exam';
    
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