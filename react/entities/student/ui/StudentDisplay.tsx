// ./react/entities/student/ui/StudentDisplay.tsx
import React, { forwardRef } from 'react';
import type { Student } from '../model/useStudentDataWithRQ';
import { useUIStore } from '../../../shared/store/uiStore';
import StudentDisplayDesktop from './StudentDisplayDesktop';
import StudentDisplayMobile from './StudentDisplayMobile';
import type { SortConfig } from '../../../shared/ui/glasstable/GlassTable';

type StudentDisplayProps = {
    students: Student[];
    isLoading?: boolean;
    sortConfig?: SortConfig | null;
    onSort?: (key: string) => void;
    selectedIds: Set<string>;
    onToggleRow: (studentId: string) => void;
    isHeaderChecked: boolean;
    onToggleHeader: () => void;
    isHeaderDisabled?: boolean;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: Student['status'] | 'delete') => void;
    onCancel: () => void;
    scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    closeActiveCard: () => void;
};

const StudentDisplay = forwardRef<HTMLDivElement, StudentDisplayProps>((props, ref) => {
    const { currentBreakpoint } = useUIStore();
    
    if (currentBreakpoint === 'mobile') {
        return <StudentDisplayMobile {...props} />;
    }
    
    return <StudentDisplayDesktop ref={ref} {...props} />;
});

StudentDisplay.displayName = 'StudentDisplay';
export default StudentDisplay;