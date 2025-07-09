import React, { useMemo } from 'react';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectRightSidebarConfig } from '../../shared/store/layoutStore';
import { LuSettings2, LuChevronRight, LuCircleX, LuCirclePlus, LuClipboardList, LuBookMarked, LuSearch, LuFileJson2, LuUsers, LuUserPlus } from 'react-icons/lu';
import ProblemTextEditor from '../../features/problem-text-editing/ui/ProblemTextEditor';
import StudentRegistrationForm from '../../features/student-registration/ui/StudentRegistrationForm';
import TableColumnToggler from '../../features/table-column-toggler/ui/TableColumnToggler';
import PromptCollection from '../../features/prompt-collection/ui/PromptCollection';
import StudentEditForm from '../../features/student-editing/ui/StudentEditForm';
import { useProblemPublishingStore, type ProcessedProblem } from '../../features/problem-publishing/model/problemPublishingStore';
import LatexHelpPanel from '../../features/latex-help/ui/LatexHelpPanel';
import JsonViewerPanel from '../../features/json-viewer/ui/JsonViewerPanel';
import ExamTimerDisplay from '../../features/exam-timer-display/ui/ExamTimerDisplay';
import SelectedStudentsPanel from '../../features/selected-students-viewer/ui/SelectedStudentsPanel';
import { useStudentDataWithRQ } from '../../entities/student/model/useStudentDataWithRQ';
import { useStaffData } from '../../entities/staff/model/useStaffData';
import type { SidebarButtonType } from '../../shared/store/layout.config';
import StaffManagementWidget from '../staff-management/StaffManagementWidget';

const iconMap: Record<SidebarButtonType, React.FC> = {
    register: () => <LuCirclePlus size={22} />,
    teacherRegister: () => <LuUserPlus size={22} />,
    settings: () => <LuSettings2 size={20} />,
    prompt: () => <LuClipboardList size={20} />,
    latexHelp: () => <LuBookMarked size={20} />,
    search: () => <LuSearch size={20} />,
    jsonView: () => <LuFileJson2 size={20} />,
    selectedStudents: () => <LuUsers size={20} />,
};

interface ProblemEditorWrapperProps {
    isSaving?: boolean;
    onSave: (problem: ProcessedProblem) => void;
    onRevert: (problemId: string) => void;
    onClose: () => void;
    onProblemChange: (problem: ProcessedProblem) => void;
}

const ProblemEditorWrapper: React.FC<ProblemEditorWrapperProps> = (props) => {
    const { draftProblems, editingProblemId } = useProblemPublishingStore();
    const problemToEdit = draftProblems?.find(p => p.uniqueId === editingProblemId);
    if (!problemToEdit) return <div>수정할 문제를 선택해주세요.</div>;
    return <ProblemTextEditor problem={problemToEdit} {...props} />;
};

const StudentRelatedSidebarContent: React.FC = () => {
    const { content } = useLayoutStore(selectRightSidebarConfig);
    const { pageActions } = useLayoutStore.getState();

    const academyId = (content.type === 'register' || content.type === 'edit') ? content.academyId : null;

    const { students: allStudents, updateStudent, updateStudentStatus } = useStudentDataWithRQ(academyId);
    const { staffMembers, isLoadingStaff } = useStaffData(academyId);

    const allTeachers = useMemo(() => 
        staffMembers.filter(s => s.member_type === 'teacher'), 
    [staffMembers]);

    if (content.type === 'register') {
        // [복구] allStudents prop을 다시 전달합니다.
        return (
            <StudentRegistrationForm 
                onSuccess={pageActions.onClose || (() => {})} 
                academyId={content.academyId} 
                allStudents={allStudents}
                allTeachers={allTeachers}
                isLoadingStaff={isLoadingStaff}
            />
        );
    }
    
    if (content.type === 'edit') {
        return (
            <StudentEditForm 
                onSuccess={pageActions.onClose || (() => {})} 
                student={content.student} 
                updateStudent={updateStudent}
                updateStudentStatus={updateStudentStatus}
                allStudents={allStudents}
                allTeachers={allTeachers}
                isLoadingStaff={isLoadingStaff}
            />
        );
    }
    
    if (content.type === 'selectedStudents') {
        return <SelectedStudentsPanel />;
    }
    
    return null;
}

const SidebarContentRenderer: React.FC = () => {
    const { content } = useLayoutStore(selectRightSidebarConfig);
    const { pageActions } = useLayoutStore.getState();
    
    switch(content.type) {
        case 'closed':
            return null;

        case 'register':
        case 'edit':
        case 'selectedStudents':
            return <StudentRelatedSidebarContent />;
        
        case 'teacherRegister':
            return <StaffManagementWidget 
                        academyId={content.academyId} 
                        onSuccess={pageActions.onClose || (() => {})} 
                    />;
        
        case 'problemEditor':
            return <ProblemEditorWrapper {...(content.props as any)} />;
            
        case 'settings': {
             const currentPath = window.location.pathname;
             if (currentPath.startsWith('/problem-publishing') || currentPath.startsWith('/dashboard')) {
                 return <TableColumnToggler />;
             }
             if (currentPath.startsWith('/mobile-exam')) {
                return <ExamTimerDisplay />;
             }
             return (
                 <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>
                     <h4>설정</h4>
                     <p>현재 페이지의 설정 옵션이 여기에 표시됩니다.</p>
                 </div>
             );
        }

        case 'prompt':
            return <PromptCollection {...(content.props as any)} />;
        
        case 'latexHelp':
            return <LatexHelpPanel />;
            
        case 'jsonViewer':
            return <JsonViewerPanel {...(content.props as any)} />;
        
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
    const { content, isExtraWide } = useLayoutStore(selectRightSidebarConfig);
    const { availableTriggers, pageActions } = useLayoutStore();
    const { currentBreakpoint } = useUIStore();
    
    const isOpen = content.type !== 'closed';

    const sidebarClassName = `
        glass-sidebar-right
        ${isOpen ? 'expanded' : ''}
        ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''}
        ${isOpen && currentBreakpoint === 'mobile' ? 'open' : ''}
        ${isExtraWide ? 'right-sidebar-extra-wide' : ''}
    `.trim().replace(/\s+/g, ' ');

    const handleTriggerClick = (type: SidebarButtonType) => {
        const actionMap: Record<SidebarButtonType, (() => void) | undefined> = {
            register: pageActions.openRegisterSidebar,
            teacherRegister: pageActions.openTeacherRegisterSidebar,
            settings: pageActions.openSettingsSidebar,
            prompt: pageActions.openPromptSidebar,
            latexHelp: pageActions.openLatexHelpSidebar,
            search: pageActions.openSearchSidebar,
            jsonView: pageActions.openJsonViewSidebar,
            selectedStudents: pageActions.openSelectedStudentsSidebar,
        };
        const action = actionMap[type];
        if (action) {
            action();
        }
    };

    return (
        <aside className={sidebarClassName}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
                    {isOpen ? (
                        <Tippy content="닫기" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                            <button onClick={pageActions.onClose} className="settings-toggle-button active" aria-label="사이드바 닫기">
                                <LuCircleX size={22} />
                            </button>
                        </Tippy>
                    ) : (
                        availableTriggers.map((trigger) => {
                            const IconComponent = iconMap[trigger.type];
                            if (!IconComponent) return null;

                            return (
                                <Tippy key={trigger.type} content={trigger.tooltip} placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={() => handleTriggerClick(trigger.type)}
                                        className="settings-toggle-button"
                                        aria-label={trigger.tooltip}
                                    >
                                        <IconComponent />
                                    </button>
                                </Tippy>
                            );
                        })
                    )}
                </div>
            )}
            
            {isOpen && (
                <div className="expanded-content-area rgs-content">
                     {currentBreakpoint === 'mobile' && (
                        <div className="sidebar-header rgs-mobile-header">
                            <Tippy content="닫기" placement="bottom" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                                <button onClick={pageActions.onClose} className="sidebar-close-button mobile-only rgs-close-btn" aria-label="닫기">
                                    <LuChevronRight size={22} />
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