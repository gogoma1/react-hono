import React from 'react'; // React.memo를 사용하기 위해 import 추가
import { Outlet } from 'react-router';
import { useUIStore } from '../../shared/store/uiStore';
import BackgroundBlobs from '../rootlayout/BackgroundBlobs';
import GlassNavbar from '../rootlayout/GlassNavbar';
import GlassSidebar from '../rootlayout/GlassSidebar';
import GlassSidebarRight from '../rootlayout/GlassSidebarRight';

// ▼▼▼▼▼ [핵심 1] Outlet을 포함하는 부분을 안정적인 컴포넌트로 분리하고 memo로 감쌉니다. ▼▼▼▼▼
const MainContent = () => {
    return (
        <main className="main-content">
            <Outlet />
        </main>
    );
};
const MemoizedMainContent = React.memo(MainContent);
// ▲▲▲▲▲ [핵심 1] MainContent는 props가 없으므로, 한번 렌더링된 후에는 절대 다시 렌더링되지 않습니다. ▲▲▲▲▲


// UILayoutContainer는 삭제하고 RootLayout으로 통합하여 구조를 단순화합니다.
const RootLayout = () => {
    // UI 상태 구독 로직은 RootLayout이 직접 담당합니다.
    const currentBreakpoint = useUIStore((state) => state.currentBreakpoint);
    const mobileSidebarType = useUIStore((state) => state.mobileSidebarType);
    const closeMobileSidebar = useUIStore((state) => state.closeMobileSidebar);

    const showOverlay = currentBreakpoint === 'mobile' && mobileSidebarType !== null;

    return (
        <div className={`app-container ${currentBreakpoint}-layout ${showOverlay ? 'mobile-sidebar-active' : ''}`}>
            <div className="background-blobs-wrapper"><BackgroundBlobs /></div>
            {showOverlay && (<div className={`clickable-overlay active`} onClick={closeMobileSidebar} aria-hidden="true" />)}
            
            {currentBreakpoint === 'mobile' && <GlassSidebar />}
            {currentBreakpoint === 'mobile' && <GlassSidebarRight />}
            
            <div className="layout-main-wrapper">
                <GlassNavbar />
                <div className="content-body-wrapper">
                    {currentBreakpoint !== 'mobile' && <GlassSidebar />}
                    
                    {/* ▼▼▼▼▼ [핵심 2] Outlet 대신 메모이제이션된 컴포넌트를 렌더링합니다. ▼▼▼▼▼ */}
                    <MemoizedMainContent />
                    
                    {currentBreakpoint !== 'mobile' && <GlassSidebarRight />}
                </div>
            </div>
        </div>
    );
};

export default RootLayout;