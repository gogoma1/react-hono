import React from 'react';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectRightSidebarConfig, useSidebarTriggers } from '../../shared/store/layoutStore';
import { LuSettings2, LuChevronRight, LuCircleX, LuCirclePlus, LuClipboardList, LuBookMarked, LuSearch, LuFileJson2 } from 'react-icons/lu';
import ProblemTextEditor from '../../features/problem-text-editing/ui/ProblemTextEditor';
import StudentRegistrationForm from '../../features/student-registration/ui/StudentRegistrationForm';
import TableColumnToggler from '../../features/table-column-toggler/ui/TableColumnToggler';
import PromptCollection from '../../features/prompt-collection/ui/PromptCollection';
import StudentEditForm from '../../features/student-editing/ui/StudentEditForm';
import { useProblemPublishingStore, type ProcessedProblem } from '../../features/problem-publishing/model/problemPublishingStore';
import LatexHelpPanel from '../../features/latex-help/ui/LatexHelpPanel';
import JsonViewerPanel from '../../features/json-viewer/ui/JsonViewerPanel';

const SettingsIcon = () => <LuSettings2 size={20} />;
const CloseRightSidebarIcon = () => <LuChevronRight size={22} />;
const CloseIcon = () => <LuCircleX size={22} />;
const PlusIcon = () => <LuCirclePlus size={22} />;
const PromptIcon = () => <LuClipboardList size={20} />;
const LatexHelpIcon = () => <LuBookMarked size={20} />;
const SearchIcon = () => <LuSearch size={20} />;
const JsonViewIcon = () => <LuFileJson2 size={20} />;

// [핵심 수정] Props 인터페이스를 파일 최상단으로 이동
interface ProblemEditorWrapperProps {
    isSaving?: boolean;
    onSave: (problem: ProcessedProblem) => void;
    onRevert: (problemId: string) => void;
    onClose: () => void;
    onProblemChange: (problem: ProcessedProblem) => void;
}

// [핵심 수정] ProblemEditorWrapper 컴포넌트를 GlassSidebarRight 밖, 파일 최상위 레벨로 이동
const ProblemEditorWrapper: React.FC<ProblemEditorWrapperProps> = (props) => {
    const { draftProblems, editingProblemId } = useProblemPublishingStore();
    const problemToEdit = draftProblems?.find(p => p.uniqueId === editingProblemId);

    if (!problemToEdit) {
        return <div>수정할 문제를 선택해주세요.</div>;
    }

    return <ProblemTextEditor problem={problemToEdit} {...props} />;
};

// [핵심 수정] SidebarContentRenderer 컴포넌트도 GlassSidebarRight 밖으로 이동
const SidebarContentRenderer: React.FC = () => {
    const { contentConfig } = useLayoutStore(selectRightSidebarConfig);
    const { pageActions } = useLayoutStore.getState();

    if (!contentConfig?.type) {
        return null;
    }

    switch(contentConfig.type) {
        case 'problemEditor': {
            const { onSave, onRevert, onClose, onProblemChange, isSaving } = contentConfig.props || {};
            const { editingProblemId } = useProblemPublishingStore.getState();
            if (!editingProblemId) return <div>선택된 문제가 없습니다.</div>;
            
            return (
                <ProblemEditorWrapper
                    isSaving={isSaving}
                    onSave={onSave}
                    onRevert={onRevert}
                    onClose={onClose}
                    onProblemChange={onProblemChange}
                />
            );
        }
        case 'register':
            return <StudentRegistrationForm onSuccess={pageActions.onClose || (() => {})} />;
        
        case 'edit': {
            const { student } = contentConfig.props || {};
            if (!student) return <div>학생 정보를 불러오는 중...</div>;
            return <StudentEditForm student={student} onSuccess={pageActions.onClose || (() => {})} />;
        }

        case 'settings': {
             const currentPath = window.location.pathname;
             if (currentPath.startsWith('/problem-publishing')) {
                 return <TableColumnToggler />;
             }
             if (currentPath.startsWith('/dashboard')) {
                 return <TableColumnToggler />;
             }
             return (
                 <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                     <h4>설정</h4>
                     <p>현재 페이지의 설정 옵션이 여기에 표시됩니다.</p>
                 </div>
             );
        }

        case 'prompt':
            return <PromptCollection {...(contentConfig.props as any)} />;
        
        case 'latexHelp':
            return <LatexHelpPanel />;
            
        case 'jsonViewer': {
            const { problems } = contentConfig.props || {};
            if (!problems) return <div>JSON으로 변환할 데이터가 없습니다.</div>;
            return <JsonViewerPanel problems={problems} />;
        }

        default:
            return (
                 <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                    <h4>콘텐츠 없음</h4>
                    <p>표시할 사이드바 콘텐츠가 설정되지 않았습니다.</p>
                </div>
            );
    }
}


const GlassSidebarRight: React.FC = () => {
    const { contentConfig, isExtraWide } = useLayoutStore(selectRightSidebarConfig);
    const { registerTrigger, settingsTrigger, promptTrigger, latexHelpTrigger, searchTrigger, jsonViewTrigger, onClose } = useSidebarTriggers();
    const { mobileSidebarType, currentBreakpoint } = useUIStore();
    
    const isRightSidebarExpanded = contentConfig.type !== null;

    const isOpen = currentBreakpoint === 'mobile' ? mobileSidebarType === 'right' : isRightSidebarExpanded;

    const sidebarClassName = `
        glass-sidebar-right
        ${isOpen ? 'expanded' : ''}
        ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''}
        ${isOpen && currentBreakpoint === 'mobile' ? 'open' : ''}
        ${isExtraWide ? 'right-sidebar-extra-wide' : ''}
    `.trim().replace(/\s+/g, ' ');

    return (
        <aside className={sidebarClassName}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
                    {isOpen ? (
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
                            
                            {searchTrigger && (
                                <Tippy content={searchTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={searchTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={searchTrigger.tooltip}
                                    >
                                        <SearchIcon />
                                    </button>
                                </Tippy>
                            )}

                            {jsonViewTrigger && (
                                <Tippy content={jsonViewTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={jsonViewTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={jsonViewTrigger.tooltip}
                                    >
                                        <JsonViewIcon />
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

                            {latexHelpTrigger && (
                                <Tippy content={latexHelpTrigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={latexHelpTrigger.onClick}
                                        className="settings-toggle-button"
                                        aria-label={latexHelpTrigger.tooltip}
                                    >
                                        <LatexHelpIcon />
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
                    
                    <SidebarContentRenderer />
                </div>
            )}
        </aside>
    );
};

export default GlassSidebarRight;