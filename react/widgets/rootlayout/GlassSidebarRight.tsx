import React from 'react';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectRightSidebarContent, useSidebarTriggers } from '../../shared/store/layoutStore';
import { LuSettings2, LuChevronRight, LuCircleX, LuCirclePlus, LuClipboardList } from 'react-icons/lu';

const SettingsIcon = () => <LuSettings2 size={20} />;
const CloseRightSidebarIcon = () => <LuChevronRight size={22} />;
const CloseIcon = () => <LuCircleX size={22} />;
const PlusIcon = () => <LuCirclePlus size={22} />;
const PromptIcon = () => <LuClipboardList size={20} />;

const GlassSidebarRight: React.FC = () => {
    const rightSidebarContent = useLayoutStore(selectRightSidebarContent);
    const { registerTrigger, settingsTrigger, promptTrigger, onClose } = useSidebarTriggers();
    
    const { isRightSidebarExpanded, mobileSidebarType, currentBreakpoint } = useUIStore();
    
    const isOpen = currentBreakpoint === 'mobile' ? mobileSidebarType === 'right' : isRightSidebarExpanded;

    return (
        <aside className={`glass-sidebar-right ${isOpen ? 'expanded' : ''} ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''} ${isOpen ? 'open' : ''}`}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
                    {isOpen ? ( // [수정] isRightSidebarExpanded -> isOpen
                        <Tippy content="닫기" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                            <button onClick={onClose} className="settings-toggle-button active" aria-label="사이드바 닫기">
                                <CloseIcon />
                            </button>
                        </Tippy>
                    ) : (
                        <>
                            {registerTrigger && (
                                <Tippy content={registerTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button onClick={registerTrigger.onClick} className="settings-toggle-button" aria-label={registerTrigger.tooltip}>
                                        <PlusIcon />
                                    </button>
                                </Tippy>
                            )}
                            
                            {promptTrigger && (
                                <Tippy content={promptTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={promptTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={promptTrigger.tooltip}
                                    >
                                        <PromptIcon />
                                    </button>
                                </Tippy>
                            )}

                            {settingsTrigger && (
                                <Tippy content={settingsTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={settingsTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={settingsTrigger.tooltip}
                                    >
                                        <SettingsIcon />
                                    </button>
                                </Tippy>
                            )}
                        </>
                    )}
                </div>
            )}
            
            {isOpen && (
                <div className="expanded-content-area rgs-content">
                     {currentBreakpoint === 'mobile' && (
                        <div className="sidebar-header rgs-mobile-header">
                            <Tippy content="닫기" placement="bottom" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                                <button onClick={onClose} className="sidebar-close-button mobile-only rgs-close-btn" aria-label="닫기">
                                    <CloseRightSidebarIcon />
                                </button>
                            </Tippy>
                        </div>
                     )}
                    
                    {rightSidebarContent}
                </div>
            )}
        </aside>
    );
};

export default GlassSidebarRight;