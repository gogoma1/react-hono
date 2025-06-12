import { Outlet } from 'react-router';
// LayoutProvider 임포트 제거됨
import BackgroundBlobs from '../rootlayout/BackgroundBlobs';
import GlassNavbar from '../rootlayout/GlassNavbar';
import GlassSidebar from '../rootlayout/GlassSidebar';
import GlassSidebarRight from '../rootlayout/GlassSidebarRight';
import { useUIStore } from '../../shared/store/uiStore';

const RootLayout = () => {
  const { currentBreakpoint, mobileSidebarType, closeMobileSidebar } = useUIStore();
  const showOverlay = currentBreakpoint === 'mobile' && mobileSidebarType !== null;

  return (
    // LayoutProvider가 제거됨
    <div className={`app-container ${currentBreakpoint}-layout ${showOverlay ? 'mobile-sidebar-active' : ''}`}>
      <div className="background-blobs-wrapper"><BackgroundBlobs /></div>
      {showOverlay && (<div className={`clickable-overlay active`} onClick={closeMobileSidebar} aria-hidden="true" />)}
      
      {currentBreakpoint === 'mobile' && <GlassSidebar />}
      {currentBreakpoint === 'mobile' && <GlassSidebarRight />}
      
      <div className="layout-main-wrapper">
        <GlassNavbar />
        <div className="content-body-wrapper">
          {currentBreakpoint !== 'mobile' && <GlassSidebar />}
          
          <main className="main-content">
            <Outlet />
          </main>
          
          {currentBreakpoint !== 'mobile' && <GlassSidebarRight />}
        </div>
      </div>
    </div>
  );
};

export default RootLayout;