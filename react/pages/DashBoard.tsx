import React, { useEffect } from 'react';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useLayoutStore } from '../shared/store/layoutStore'; // 🌟 [1/3] 스토어 임포트
import StudentRegistrationForm from '../features/student-registration/ui/StudentRegistrationForm'; // 🌟 [2/3] 렌더링할 컴포넌트 임포트
import { useUIStore } from '../shared/store/uiStore';

const DashBoard: React.FC = () => {
    // 🌟 [3/3] 스토어에서 액션 함수를 직접 가져옵니다.
    // 컴포넌트가 상태를 구독하지 않고 액션만 사용하므로, 스토어 상태가 변경되어도 리렌더링되지 않습니다.
    const setRightSidebarContent = useLayoutStore.getState().setRightSidebarContent;
    const setRightSidebarExpanded = useUIStore.getState().setRightSidebarExpanded;

    useEffect(() => {
        setRightSidebarContent(<StudentRegistrationForm />);

        // 페이지가 언마운트될 때 정리(cleanup) 함수 실행
        return () => {
            setRightSidebarContent(null);
            setRightSidebarExpanded(false);
        };
    }, [setRightSidebarContent, setRightSidebarExpanded]);

    return (
        <div>
            <StudentTableWidget />
        </div>
    );
};

export default DashBoard;