import React from 'react';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useStudentDashboard } from '../features/student-dashboard';
import './DashBoard.css';

const DashBoard: React.FC = () => {
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
    
    if (isError) {
        return (
            <div className="dashboard-error-container">
                <h2>학생 데이터 로딩 오류</h2>
                <p>{error?.message || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
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