// ./react/widgets/rootlayout/RootLayout.tsx

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
    
    const sidebarStateClass = `
        ${isLeftSidebarExpanded ? 'left-sidebar-expanded' : 'left-sidebar-collapsed'}
        ${isRightSidebarExpanded ? 'right-sidebar-expanded' : 'right-sidebar-collapsed'}
        ${isRightSidebarExtraWide ? 'right-sidebar-extra-wide' : ''}
    `.trim().replace(/\s+/g, ' ');

    const isWorkbenchPage = location.pathname === '/problem-workbench';
    const mainContentClasses = `main-content ${isWorkbenchPage ? 'main-content--compact-padding' : ''}`;

    const bottomContentAreaClasses = `
        bottom-content-area 
        ${isSearchBoxVisible ? 'visible' : ''}
    `.trim();

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