import React, { useState, useRef, useEffect, useCallback } from 'react';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useStudentDashboard } from '../features/student-dashboard';
import './DashBoard.css';
import { LuSchool, LuChevronDown } from 'react-icons/lu';
import GlassPopover from '../shared/components/GlassPopover';
import { useLayoutStore, type RegisteredPageActions } from '../shared/store/layoutStore';
// [핵심 수정] useUIStore 임포트 제거 (직접 사용하지 않음)
// import { useUIStore } from '../shared/store/uiStore';

const DashBoard: React.FC = () => {
    const {
        students,
        isLoading,
        isError,
        error,
        selectedIds,
        toggleRow,
        isAllSelected,
        handleToggleAll,
        onRequestEdit,
        myAcademies,
        selectedAcademyId,
        onSelectAcademy,
    } = useStudentDashboard();

    const { registerPageActions, unregisterPageActions, setRightSidebarContent, closeRightSidebar } = useLayoutStore.getState();
    // [핵심 수정] setRightSidebarExpanded 상태 직접 제어 로직 제거
    // const { setRightSidebarExpanded } = useUIStore.getState();
    
    const [isAcademyPopoverOpen, setIsAcademyPopoverOpen] = useState(false);
    const academySelectorRef = useRef<HTMLButtonElement>(null);

    const selectedAcademy = myAcademies.find(academy => academy.id === selectedAcademyId);
    
    const handleCloseSidebar = useCallback(() => {
        closeRightSidebar();
        // [핵심 수정] setRightSidebarExpanded(false) 호출 제거
    }, [closeRightSidebar]);
    
    const handleOpenRegisterSidebar = useCallback(() => {
        if (!selectedAcademyId) return alert("학생을 등록할 학원을 먼저 선택해주세요.");
        setRightSidebarContent({ type: 'register', academyId: selectedAcademyId });
        // [핵심 수정] setRightSidebarExpanded(true) 호출 제거
    }, [setRightSidebarContent, selectedAcademyId]);

    const handleOpenTeacherRegisterSidebar = useCallback(() => {
        if (!selectedAcademyId) return alert("강사를 등록할 학원을 먼저 선택해주세요.");
        setRightSidebarContent({ type: 'teacherRegister', academyId: selectedAcademyId });
        // [핵심 수정] setRightSidebarExpanded(true) 호출 제거
    }, [setRightSidebarContent, selectedAcademyId]);
    
    const handleOpenSettingsSidebar = useCallback(() => {
        setRightSidebarContent({ type: 'settings' });
        // [핵심 수정] setRightSidebarExpanded(true) 호출 제거
    }, [setRightSidebarContent]);

    useEffect(() => {
        const pageActionsToRegister: Partial<RegisteredPageActions> = {
            openRegisterSidebar: handleOpenRegisterSidebar,
            openTeacherRegisterSidebar: handleOpenTeacherRegisterSidebar,
            openSettingsSidebar: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar,
            openEditSidebar: onRequestEdit,
        };
        registerPageActions(pageActionsToRegister);
        
        return () => {
            const actionKeys = Object.keys(pageActionsToRegister) as (keyof RegisteredPageActions)[];
            unregisterPageActions(actionKeys);
        };
    }, [registerPageActions, unregisterPageActions, handleOpenRegisterSidebar, handleOpenTeacherRegisterSidebar, handleOpenSettingsSidebar, handleCloseSidebar, onRequestEdit]);

    const handleAcademySelect = (academyId: string) => {
        onSelectAcademy(academyId);
        setIsAcademyPopoverOpen(false);
    };

    if (isError) {
        return <div className="dashboard-error-container"><h2>학생 데이터 로딩 오류</h2><p>{error?.message || '알 수 없는 오류가 발생했습니다.'}</p></div>;
    }

    if (!isLoading && myAcademies.length === 0) {
        return <div className="dashboard-container no-academies"><h2>등록된 학원이 없습니다.</h2><p>먼저 프로필 설정에서 원장으로 가입하고 학원을 등록해주세요.</p></div>;
    }
    
    return (
        <div className="dashboard-container">
            <StudentTableWidget 
                key={selectedAcademyId} 
                className="dashboard-widget"
                students={students} 
                isLoading={isLoading}
                onRequestEdit={onRequestEdit}
                selectedIds={selectedIds}
                toggleRow={toggleRow}
                isAllSelected={isAllSelected}
                toggleSelectAll={handleToggleAll}
            >
                <button
                    ref={academySelectorRef}
                    className="widget-title-button"
                    onClick={() => setIsAcademyPopoverOpen(prev => !prev)}
                    disabled={isLoading || myAcademies.length <= 1}
                    aria-haspopup="true"
                    aria-expanded={isAcademyPopoverOpen}
                >
                    <LuSchool className="widget-title-icon" />
                    <h3 className="widget-title-text">
                        {selectedAcademy?.name || '학원 선택'} - 재원생 목록 ({isLoading ? '...' : students.length}명)
                    </h3>
                    <LuChevronDown className={`widget-title-chevron ${isAcademyPopoverOpen ? 'open' : ''}`} />
                </button>
            </StudentTableWidget>

            <GlassPopover
                isOpen={isAcademyPopoverOpen}
                onClose={() => setIsAcademyPopoverOpen(false)}
                anchorEl={academySelectorRef.current}
                placement="bottom-start"
                className="academy-select-popover"
            >
                <ul className="academy-select-list">
                    {myAcademies.map(academy => (
                        <li key={academy.id}>
                            <button className={`academy-select-item ${selectedAcademyId === academy.id ? 'active' : ''}`} onClick={() => handleAcademySelect(academy.id)}>
                                <span className="item-name">{academy.name}</span>
                                <span className="item-region">{academy.region}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </GlassPopover>
        </div>
    );
};

export default DashBoard;