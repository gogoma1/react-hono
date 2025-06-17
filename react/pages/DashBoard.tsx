import React, { useState, useEffect, useCallback } from 'react';
import Tippy from '@tippyjs/react';
// [수정] LuCircleX 아이콘을 추가로 import 합니다.
import { LuCirclePlus, LuCircleX } from 'react-icons/lu';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import StudentRegistrationForm from '../features/student-registration/ui/StudentRegistrationForm';
import StudentEditForm from '../features/student-editing/ui/StudentEditForm';
import type { Student } from '../entities/student/model/useStudentDataWithRQ';

const PlusIcon = () => <LuCirclePlus size={22} />;
// [추가] 닫기 아이콘 컴포넌트를 정의합니다.
const CloseIcon = () => <LuCircleX size={22} />;

const DashBoard: React.FC = () => {
    const { setRightSidebarContent, setRightSidebarTrigger } = useLayoutStore();
    const { isRightSidebarExpanded, setRightSidebarExpanded } = useUIStore();

    const [sidebarMode, setSidebarMode] = useState<'register' | 'edit'>('register');
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

    const handleFormSuccess = useCallback(() => {
        setRightSidebarExpanded(false);
    }, [setRightSidebarExpanded]);
    
    const handleRequestEdit = useCallback((student: Student) => {
        setSidebarMode('edit');
        setStudentToEdit(student);
        setRightSidebarExpanded(true);
    }, [setRightSidebarExpanded]);

    const handleOpenRegisterSidebar = useCallback(() => {
        setSidebarMode('register');
        setStudentToEdit(null);
        setRightSidebarExpanded(true);
    }, [setRightSidebarExpanded]);

    useEffect(() => {
        const content = sidebarMode === 'edit' && studentToEdit
            ? <StudentEditForm student={studentToEdit} onSuccess={handleFormSuccess} />
            : <StudentRegistrationForm onSuccess={handleFormSuccess} />;
        setRightSidebarContent(content);
    }, [sidebarMode, studentToEdit, setRightSidebarContent, handleFormSuccess]);

    // ▼▼▼▼▼ [핵심] 사이드바 상태에 따라 동적으로 트리거를 교체하는 로직 ▼▼▼▼▼
    useEffect(() => {
        let triggerComponent;

        if (isRightSidebarExpanded) {
            // 사이드바가 열려있을 때: '닫기' 아이콘 표시
            triggerComponent = (
                <Tippy content="닫기" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                    <button
                        onClick={() => setRightSidebarExpanded(false)} // 클릭 시 사이드바 닫기
                        className="settings-toggle-button active" // 'active' 클래스로 스타일링 가능
                        aria-label="사이드바 닫기"
                    >
                        <CloseIcon />
                    </button>
                </Tippy>
            );
        } else {
            // 사이드바가 닫혀있을 때: '신입생 등록' 아이콘 표시
            triggerComponent = (
                <Tippy content="신입생 등록" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                    <button
                        onClick={handleOpenRegisterSidebar}
                        className="settings-toggle-button"
                        aria-label="신입생 등록"
                    >
                        <PlusIcon />
                    </button>
                </Tippy>
            );
        }

        // 동적으로 생성된 트리거를 레이아웃 스토어에 등록
        setRightSidebarTrigger(triggerComponent);

        return () => {
            // 페이지 벗어날 때 트리거 초기화
            setRightSidebarTrigger(null);
        };
    // isRightSidebarExpanded가 변경될 때마다 이 훅을 다시 실행
    }, [isRightSidebarExpanded, setRightSidebarTrigger, handleOpenRegisterSidebar, setRightSidebarExpanded]);
    // ▲▲▲▲▲ [핵심] 로직 끝 ▲▲▲▲▲

    useEffect(() => {
        if (!isRightSidebarExpanded) {
            if (sidebarMode !== 'register' || studentToEdit !== null) {
                setTimeout(() => {
                    setSidebarMode('register');
                    setStudentToEdit(null);
                }, 300);
            }
        }
    }, [isRightSidebarExpanded, sidebarMode, studentToEdit]);
    
    useEffect(() => {
        return () => {
            setRightSidebarContent(null);
            setRightSidebarExpanded(false);
        };
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    return (
        <div>
            <StudentTableWidget onRequestEdit={handleRequestEdit} />
        </div>
    );
};

export default DashBoard;