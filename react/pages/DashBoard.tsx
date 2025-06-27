import React from 'react';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
// [리팩토링] 로직을 담당하는 커스텀 훅을 import
import { useStudentDashboard } from '../features/student-dashboard';

const DashBoard: React.FC = () => {
    // [리팩토링] 훅 호출 한 줄로 기존의 모든 로직을 대체
    const {
        students,
        isLoading,
        isError,
        error,
        selectedIds,
        toggleRow,
        isAllSelected,
        toggleSelectAll,
        onRequestEdit,
    } = useStudentDashboard();
    
    // [리팩토링] 뷰 로직은 그대로 유지 (로딩/에러 처리)
    if (isError) {
        return (
            <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
                <h2>학생 데이터 로딩 오류</h2>
                <p>{error?.message || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}</p>
            </div>
        );
    }

    // [리팩토링] 훅에서 반환된 값들을 위젯에 props로 전달
    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <StudentTableWidget 
                students={students} 
                isLoading={isLoading}
                onRequestEdit={onRequestEdit}
                selectedIds={selectedIds}
                toggleRow={toggleRow}
                isAllSelected={isAllSelected}
                toggleSelectAll={toggleSelectAll}
            />
        </div>
    );
};

export default DashBoard;