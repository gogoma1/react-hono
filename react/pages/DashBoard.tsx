import React, { useState, useRef } from 'react';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useStudentDashboard } from '../features/student-dashboard';
import './DashBoard.css'; // 이 파일은 비어있거나 최소한의 스타일만 가집니다.
import { LuSchool, LuChevronDown } from 'react-icons/lu';
import GlassPopover from '../shared/components/GlassPopover';

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
        myAcademies,
        selectedAcademyId,
        onSelectAcademy,
    } = useStudentDashboard();

    const [isAcademyPopoverOpen, setIsAcademyPopoverOpen] = useState(false);
    const academySelectorRef = useRef<HTMLButtonElement>(null);

    const selectedAcademy = myAcademies.find(academy => academy.id === selectedAcademyId);
    const selectedAcademyName = selectedAcademy?.name || '학원 선택';

    const handleAcademySelect = (academyId: string) => {
        onSelectAcademy(academyId);
        setIsAcademyPopoverOpen(false);
    };

    if (isError) {
        return (
            <div className="dashboard-error-container">
                <h2>학생 데이터 로딩 오류</h2>
                <p>{error?.message || '알 수 없는 오류가 발생했습니다.'}</p>
            </div>
        );
    }

    if (!isLoading && myAcademies.length === 0) {
        return (
            <div className="dashboard-container no-academies">
                <h2>등록된 학원이 없습니다.</h2>
                <p>먼저 프로필 설정에서 원장으로 가입하고 학원을 등록해주세요.</p>
            </div>
        )
    }

    return (
        <div className="dashboard-container">
            {/* [삭제] 기존 dashboard-header와 select 태그 UI 제거 */}

            <StudentTableWidget 
                key={selectedAcademyId} 
                students={students} 
                isLoading={isLoading}
                onRequestEdit={onRequestEdit}
                selectedIds={selectedIds}
                toggleRow={toggleRow}
                isAllSelected={isAllSelected}
                toggleSelectAll={toggleSelectAll}
            >
                {/* [신규] children prop을 사용하여 새로운 제목/선택기 UI를 전달 */}
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
                        {selectedAcademyName} - 재원생 목록 ({isLoading ? '...' : students.length}명)
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
                            <button 
                                className={`academy-select-item ${selectedAcademyId === academy.id ? 'active' : ''}`}
                                onClick={() => handleAcademySelect(academy.id)}
                            >
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