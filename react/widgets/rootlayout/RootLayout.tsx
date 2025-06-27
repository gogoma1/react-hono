import { useMemo, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectSearchBoxProps, selectRightSidebarConfig, StoredSearchProps } from '../../shared/store/layoutStore';
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
    
    const { contentConfig, isExtraWide: isRightSidebarExtraWide } = useLayoutStore(selectRightSidebarConfig);
    const searchBoxProps = useLayoutStore(selectSearchBoxProps);
    
    const [isSearchBoxVisible, setIsSearchBoxVisible] = useState(false);
    const [searchPropsForRender, setSearchPropsForRender] = useState<StoredSearchProps | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (searchBoxProps) {
            // 1. DOM에 렌더링할 준비
            setSearchPropsForRender(searchBoxProps);
            // 2. [수정] setTimeout으로 짧은 지연을 주어 브라우저가 초기 상태를 그리도록 강제
            timer = setTimeout(() => {
                setIsSearchBoxVisible(true);
            }, 20); // 20ms 정도의 짧은 지연
        } else {
            // 사라질 때: 애니메이션 시작
            setIsSearchBoxVisible(false);
        }
        
        return () => clearTimeout(timer); // 클린업
    }, [searchBoxProps]);
    
    const handleTransitionEnd = () => {
        // 사라지는 애니메이션이 끝났을 때만 DOM에서 제거
        if (!isSearchBoxVisible) {
            setSearchPropsForRender(null);
        }
    };

    const isRightSidebarExpanded = contentConfig.type !== null;

    const parsedSuggestionGroups = useMemo(() => {
        if (searchPropsForRender?.suggestionGroups) {
            try {
                return JSON.parse(searchPropsForRender.suggestionGroups);
            } catch (e) {
                console.error("Failed to parse suggestionGroups JSON", e);
                return [];
            }
        }
        return [];
    }, [searchPropsForRender?.suggestionGroups]);

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

                {searchPropsForRender && (
                    <div 
                        className={bottomContentAreaClasses}
                        onTransitionEnd={handleTransitionEnd}
                    >
                        <TableSearch
                            {...searchPropsForRender}
                            suggestionGroups={parsedSuggestionGroups}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RootLayout;