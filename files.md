----- ./react/App.tsx -----
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

import RootLayout from './widgets/rootlayout/RootLayout';
import ProtectedRoute from './shared/lib/ProtectedRoute';
import HomePage from './pages/HomePage';
import ExamplePage from './pages/example';
import LoginPage from './pages/LoginPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import DashBoard from './pages/DashBoard';
import StudentDetailPage from './pages/StudentDetailPage';
import AuthInitializer from './shared/lib/AuthInitializer';
import { useAuthStore, selectIsLoadingAuth } from './shared/store/authStore';
import ProblemWorkbenchPage from './pages/ProblemWorkbenchPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5분 동안 캐시 유지

    },
  },
});

function App() {
    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthInitializer />
            {isLoadingAuth ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <h1>애플리케이션 로딩 중...</h1>
                </div>
            ) : (
                <Router>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/profilesetup" element={<ProfileSetupPage />} />
                        </Route>
                        <Route element={<ProtectedRoute />}>
                            <Route element={<RootLayout />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/dashboard" element={<DashBoard />} />
                                <Route path="/exampleget" element={<ExamplePage />} />
                                <Route path="/problem-workbench" element={<ProblemWorkbenchPage />} />
                                <Route path="/student/:id" element={<StudentDetailPage />} />
                            </Route>
                        </Route>
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            )}
        </QueryClientProvider>
    );
}

export default App;
----- ./react/entities/student/api/studentApi.ts -----

import type {
    Student,
    CreateStudentInput,
    UpdateStudentInput,
    UpdateStudentInputBody
} from '../model/useStudentDataWithRQ';
import { handleApiResponse } from '../../../shared/api/api.utils';

const API_BASE = '/api/manage/student';

/**
 * 모든 학생 목록을 가져옵니다.
 */
export const fetchStudentsAPI = async (): Promise<Student[]> => {
    const res = await fetch(API_BASE, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Student[]>(res);
};

/**
 * 새로운 학생을 추가합니다.
 * @param newStudentData - 생성할 학생의 정보
 * @returns 생성된 학생 객체
 */
export const addStudentAPI = async (newStudentData: CreateStudentInput): Promise<Student> => {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newStudentData),
    });
    return handleApiResponse<Student>(res);
};

/**
 * 특정 학생의 정보를 업데이트합니다.
 * @param updateData - 업데이트할 학생의 id와 정보
 * @returns 업데이트된 학생 객체
 */
export const updateStudentAPI = async (updateData: UpdateStudentInput): Promise<Student> => {
    const { id, ...jsonData } = updateData;
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(jsonData as UpdateStudentInputBody),
    });
    return handleApiResponse<Student>(res);
};

/**
 * 특정 학생을 삭제(Soft Delete: 퇴원 처리)합니다.
 * @param id - 삭제할 학생의 id
 * @returns 성공 메시지와 삭제된 학생의 id
 */
export const deleteStudentAPI = async (id: string): Promise<{ message: string; id: string }> => {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string; id: string }>(res);
};
----- ./react/entities/student/model/useStudentDataWithRQ.ts -----
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchStudentsAPI,
    addStudentAPI,
    updateStudentAPI,
    deleteStudentAPI,
} from '../api/studentApi';

export interface CreateStudentInput {
    student_name: string;
    grade: string;
    status: '재원' | '휴원' | '퇴원';
    subject: string;
    tuition: string | number;
    admission_date?: string | null;
    student_phone?: string | null;
    guardian_phone?: string | null;
    school_name?: string | null;
    class_name?: string | null;
    teacher?: string | null;
}

export interface UpdateStudentInputBody {
    student_name?: string;
    grade?: string;
    status?: '재원' | '휴원' | '퇴원';
    subject?: string;
    tuition?: string | number;
    admission_date?: string | null;
    student_phone?: string | null;
    guardian_phone?: string | null;
    school_name?: string | null;
    class_name?: string | null;
    teacher?: string | null;
    discharge_date?: string | null;
}

export interface UpdateStudentInput extends UpdateStudentInputBody {
    id: string;
}

export interface Student {
    id: string;
    tuition: number | null;
    admission_date: string | null;
    discharge_date: string | null;
    principal_id: string | null;
    grade: string;
    student_phone: string | null;
    guardian_phone: string | null;
    school_name: string | null;
    class_name: string | null;
    student_name: string;
    teacher: string | null;
    status: '재원' | '휴원' | '퇴원';
    subject: string;
    created_at: string;
    updated_at: string;
}

export interface MutationStatus<TData = unknown, TError = Error> {
    isPending: boolean;
    isError: boolean;
    error: TError | null;
    isSuccess: boolean;
    data?: TData | undefined;
}

export const GRADE_LEVELS = [
    '초1', '초2', '초3', '초4', '초5', '초6',
    '중1', '중2', '중3',
    '고1', '고2', '고3',
];

export const STUDENTS_QUERY_KEY = 'students';

export function useStudentDataWithRQ() {
    const queryClient = useQueryClient();

    const {
        data: students = [],
        isLoading: isLoadingStudents,
        isError: isStudentsError,
        error: studentsError,
        refetch: fetchStudents
    } = useQuery<Student[], Error>({
        queryKey: [STUDENTS_QUERY_KEY],
        queryFn: fetchStudentsAPI,
    });

    const addStudentMutation = useMutation<Student, Error, CreateStudentInput>({
        mutationFn: addStudentAPI,
        onSuccess: (newStudent) => {
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) => 
                [...oldData, newStudent]
            );
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    const updateStudentMutation = useMutation<Student, Error, UpdateStudentInput>({
        mutationFn: updateStudentAPI,
        onSuccess: (updatedStudent) => {
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) =>
                oldData.map(s => s.id === updatedStudent.id ? updatedStudent : s)
            );
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    const deleteStudentMutation = useMutation<{ message: string, id: string }, Error, string>({
        mutationFn: deleteStudentAPI,
        onSuccess: (data) => {
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) =>
                oldData.filter(s => s.id !== data.id)
            );
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    return {
        students,
        isLoadingStudents,
        isStudentsError,
        studentsError,
        fetchStudents,

        addStudent: addStudentMutation.mutateAsync,
        updateStudent: updateStudentMutation.mutateAsync,
        deleteStudent: deleteStudentMutation.mutateAsync,

        addStudentStatus: {
            isPending: addStudentMutation.isPending,
            isError: addStudentMutation.isError,
            error: addStudentMutation.error,
            isSuccess: addStudentMutation.isSuccess,
            data: addStudentMutation.data,
        } as MutationStatus<Student, Error>,

        updateStudentStatus: {
            isPending: updateStudentMutation.isPending,
            isError: updateStudentMutation.isError,
            error: updateStudentMutation.error,
            isSuccess: updateStudentMutation.isSuccess,
            data: updateStudentMutation.data,
        } as MutationStatus<Student, Error>,

        deleteStudentStatus: {
            isPending: deleteStudentMutation.isPending,
            isError: deleteStudentMutation.isError,
            error: deleteStudentMutation.error,
            isSuccess: deleteStudentMutation.isSuccess,
            data: deleteStudentMutation.data,
        } as MutationStatus<{ message: string, id: string }, Error>,
    };
}
----- ./react/entities/student/ui/StudentDisplay.tsx -----
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
----- ./react/entities/student/ui/StudentDisplayDesktop.tsx -----

import React, { forwardRef, useMemo } from 'react';
import GlassTable, { type TableColumn, type SortConfig } from '../../../shared/ui/glasstable/GlassTable';
import Badge from '../../../shared/ui/Badge/Badge';
import { LuListChecks } from 'react-icons/lu';
import TableCellCheckbox from '../../../shared/ui/TableCellCheckbox/TableCellCheckbox';
import type { Student } from '../model/useStudentDataWithRQ';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { useVisibleColumns } from '../../../shared/hooks/useVisibleColumns';
import './StudentDisplayDesktop.css';

type StudentDisplayProps = {
    students: Student[];
    isLoading?: boolean;
    sortConfig?: SortConfig | null;
    onSort?: (key: string) => void;
    selectedIds: Set<string>;
    onToggleRow: (studentId: string) => void; // 이 prop이 중요합니다!
    isHeaderChecked: boolean;
    onToggleHeader: () => void;
    isHeaderDisabled?: boolean;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void; // 이 prop도 중요합니다!
    onStatusUpdate: (studentId: string, status: Student['status'] | 'delete') => void;
    onCancel: () => void;
    scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
};

const StudentDisplayDesktop = forwardRef<HTMLDivElement, StudentDisplayProps>((props, ref) => {
    const {
        students, isLoading, sortConfig, onSort, selectedIds, onToggleRow,
        isHeaderChecked, onToggleHeader, isHeaderDisabled, scrollContainerProps,
        onEdit, onNavigate, onToggleStatusEditor, onStatusUpdate, onCancel, editingStatusRowId
    } = props;
    
    const visibleColumns = useVisibleColumns();
    
    const columns = useMemo(() => {
        const allColumns: TableColumn<Student>[] = [
            {
                key: 'header_action_button',
                header: <div className="header-icon-container"><button type="button" className="header-icon-button" title={isHeaderChecked ? "모든 항목 선택 해제" : "모든 항목 선택"} onClick={onToggleHeader} disabled={isHeaderDisabled || students.length === 0} aria-pressed={isHeaderChecked}><LuListChecks size={20} /></button></div>,
                render: (student) => (
                    <TableCellCheckbox
                        isChecked={selectedIds.has(student.id)}
                        onToggle={() => onToggleRow(student.id)}
                        ariaLabel={`학생 ${student.student_name} 선택`}
                    />
                ),
                className: 'sticky-col first-sticky-col',
            },
            { key: 'student_name', header: '이름', isSortable: true },
            { key: 'grade', header: '학년', isSortable: true },
            { key: 'subject', header: '과목', isSortable: true },
            { 
                key: 'status', 
                header: '상태', 
                isSortable: true, 
                render: (student) => {
                    let statusClassName = '';
                    switch (student.status) {
                        case '재원': statusClassName = 'status-enroll'; break;
                        case '휴원': statusClassName = 'status-pause'; break;
                        case '퇴원': statusClassName = 'status-leave'; break;
                        default: statusClassName = 'status-default';
                    }
                    return <Badge className={statusClassName}>{student.status}</Badge>;
                }
            },
            { key: 'teacher', header: '담당 강사', isSortable: true, render: (student) => student.teacher || '-' },
            { key: 'student_phone', header: '학생 연락처', render: (student) => student.student_phone || '-' },
            { key: 'guardian_phone', header: '학부모 연락처' },
            { key: 'school_name', header: '학교명', isSortable: true },
            { key: 'tuition', header: '수강료', isSortable: true, render: (student) => student.tuition ? student.tuition.toLocaleString() : '-' },
            { key: 'admission_date', header: '입원일', isSortable: true, render: (student) => student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-' },
            { key: 'discharge_date', header: '퇴원일', render: (student) => student.discharge_date ? new Date(student.discharge_date).toLocaleDateString() : '-' },
            {
                key: 'actions',
                header: '관리',
                render: (student) => (
                    <StudentActionButtons 
                        studentId={student.id} 
                        studentName={student.student_name} 
                        isEditing={editingStatusRowId === student.id}
                        onEdit={() => onEdit(student)}
                        onNavigate={() => onNavigate(student.id)}
                        onToggleStatusEditor={() => onToggleStatusEditor(student.id)}
                        onStatusUpdate={onStatusUpdate} 
                        onCancel={onCancel}
                    />
                ),
                className: 'sticky-col last-sticky-col',
            },
        ];

        return allColumns.filter(col => visibleColumns[col.key as string]);

    }, [
        students,
        selectedIds,
        editingStatusRowId,
        isHeaderChecked,
        isHeaderDisabled,
        onToggleHeader,
        onToggleRow,
        onEdit,
        onNavigate,
        onToggleStatusEditor,
        onStatusUpdate,
        onCancel,
        visibleColumns,
    ]);

    return (
        <GlassTable<Student>
            ref={ref} 
            scrollContainerProps={scrollContainerProps}
            columns={columns}
            data={students} // [수정] 정렬은 상위 컴포넌트(StudentTableWidget)에서 하므로 여기서는 받은 students를 그대로 사용합니다.
            isLoading={isLoading}
            emptyMessage="표시할 학생 정보가 없습니다."
            sortConfig={sortConfig}
            onSort={onSort}
        />
    );
});

StudentDisplayDesktop.displayName = 'StudentDisplayDesktop';
export default StudentDisplayDesktop;
----- ./react/entities/student/ui/StudentDisplayMobile.tsx -----
import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import type { Student } from '../model/useStudentDataWithRQ';
import StudentActionButtons from '../../../features/student-actions/ui/StudentActionButtons';
import { useVisibleColumns } from '../../../shared/hooks/useVisibleColumns';
import './StudentDisplayMobile.css';

type StatusValue = Student['status'];

interface MobileStudentCardProps {
    student: Student;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: StatusValue | 'delete') => void;
    onCancel: () => void;
    closeActiveCard: () => void;
}

const MobileStudentCard: React.FC<MobileStudentCardProps> = ({
    student, activeCardId, onCardClick, editingStatusRowId, onEdit,
    onNavigate, onToggleStatusEditor, onStatusUpdate, onCancel, closeActiveCard,
}) => {
    const isActive = activeCardId === student.id;
    const isEditingStatus = editingStatusRowId === student.id;
    const visibleColumns = useVisibleColumns();
    
    const onEditRequest = () => {
        onEdit(student);
        closeActiveCard();
    };

    const onNavigateRequest = () => onNavigate(student.id);
    const onToggleStatusEditorRequest = () => onToggleStatusEditor(student.id);

    return (
        <div 
            className={`mobile-student-card ${isActive ? 'active' : ''}`} 
            onClick={() => onCardClick(student.id)}
            role="button"
            tabIndex={0}
            aria-expanded={isActive}
        >
            <div className="card-content-wrapper">
                <div className="card-main-info">
                    <div className="main-info-name-status">
                        <span className="main-info-name">{student.student_name}</span>
                        {visibleColumns.status && <Badge className={`status-${student.status.toLowerCase()}`}>{student.status}</Badge>}
                    </div>
                    <div className="main-info-tags">
                        {visibleColumns.grade && <span>{student.grade}</span>}
                        {visibleColumns.subject && <span>{student.subject}</span>}
                        {student.class_name && <span>{student.class_name}</span>}
                    </div>
                </div>
                <div className="card-details-grid">
                    <div className="detail-item phones">
                        {visibleColumns.guardian_phone && <span>학부모: {student.guardian_phone || '-'}</span>}
                        {visibleColumns.student_phone && <span>학생: {student.student_phone || '-'}</span>}
                    </div>
                    <div className="detail-item school-tuition">
                        {visibleColumns.school_name && <span>학교: {student.school_name || '-'}</span>}
                        {visibleColumns.tuition && <span>수강료: {student.tuition ? student.tuition.toLocaleString() : '-'}</span>}
                    </div>
                    <div className="detail-item dates">
                        {visibleColumns.admission_date && <span>입원일: {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '-'}</span>}
                        {visibleColumns.discharge_date && <span>퇴원일: {student.discharge_date ? new Date(student.discharge_date).toLocaleDateString() : '-'}</span>}
                    </div>
                    <div className="detail-item teacher-info">
                        {visibleColumns.teacher && <span>담당 강사: {student.teacher || '-'}</span>}
                    </div>
                </div>
            </div>
            <div className="card-actions">
                <StudentActionButtons
                    studentId={student.id} studentName={student.student_name} isEditing={isEditingStatus}
                    onEdit={onEditRequest} onNavigate={onNavigateRequest} onToggleStatusEditor={onToggleStatusEditorRequest}
                    onStatusUpdate={onStatusUpdate} onCancel={onCancel}
                />
            </div>
        </div>
    );
};

type StudentDisplayProps = {
    students: Student[];
    isLoading?: boolean;
    editingStatusRowId: string | null;
    onEdit: (student: Student) => void;
    onNavigate: (studentId: string) => void;
    onToggleStatusEditor: (studentId: string) => void;
    onStatusUpdate: (studentId: string, status: Student['status'] | 'delete') => void;
    onCancel: () => void;
    activeCardId: string | null;
    onCardClick: (studentId: string) => void;
    closeActiveCard: () => void;
};

const StudentDisplayMobile: React.FC<StudentDisplayProps> = (props) => {
    const { students, isLoading, ...rest } = props;

    if (isLoading) {
        return <div className="mobile-loading-state">로딩 중...</div>;
    }
    if (students.length === 0) {
        return <div className="mobile-loading-state">표시할 학생 정보가 없습니다.</div>;
    }
    return (
        <div className="mobile-student-list-container">
            {students.map(student => (
                <MobileStudentCard 
                    key={student.id} 
                    student={student}
                    {...rest}
                />
            ))}
        </div>
    );
};

export default StudentDisplayMobile;
----- ./react/features/image-upload/api/imageApi.ts -----
import { handleApiResponse } from '../../../shared/api/api.utils';

const API_BASE_UPLOAD = '/api/r2/upload';
const API_BASE_DELETE = '/api/r2/delete';

export interface UploadResponse {
    url: string;
    key: string;
}

/**
 * 이미지 파일을 서버에 업로드합니다.
 * @param file - 업로드할 이미지 파일
 * @returns 업로드된 이미지의 URL과 키
 */
export const uploadImageAPI = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(API_BASE_UPLOAD, {
        method: 'POST',
        body: formData,
        credentials: 'include', // 세션/쿠키 인증을 위해 필요
    });
    return handleApiResponse<UploadResponse>(res);
};

/**
 * 서버에서 특정 키를 가진 이미지를 삭제합니다.
 * @param key - 삭제할 이미지의 키
 */
export const deleteImageAPI = async (key: string): Promise<void> => {
    const res = await fetch(API_BASE_DELETE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key }),
    });
    await handleApiResponse<void>(res);
};
----- ./react/features/image-upload/model/useImageUploadManager.ts -----
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUploadImageMutation, useDeleteImageMutation } from './useImageUploadWithRQ';

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * URL 문자열에서 마지막 경로 세그먼트를 파일 키로 추출합니다.
 * @param url - R2 공개 URL
 * @returns 추출된 키 또는 null
 */
function extractKeyFromUrl(url: string): string | null {
    if (!url) return null;
    try {
        const urlObject = new URL(url);
        const pathSegments = urlObject.pathname.split('/').filter(Boolean);
        return pathSegments.length > 0 ? pathSegments[pathSegments.length - 1] : null;
    } catch (e) {
        console.warn(`Could not parse URL, falling back to substring: ${url}`, e);
        const lastSlashIndex = url.lastIndexOf('/');
        if (lastSlashIndex !== -1 && lastSlashIndex < url.length - 1) {
            return url.substring(lastSlashIndex + 1);
        }
        return null;
    }
}

/**
 * Markdown 텍스트 내의 이미지 참조를 관리하고,
 * R2에 이미지를 업로드/교체/정렬하는 로직을 담당하는 커스텀 훅.
 * @param markdownInput - 현재 에디터의 Markdown 텍스트
 */
export function useImageUploadManager(markdownInput: string) {
    const uploadMutation = useUploadImageMutation();
    const deleteMutation = useDeleteImageMutation();

    const [extractedImages, setExtractedImages] = useState<string[]>([]);
    const [localUrls, setLocalUrls] = useState<Record<string, string | undefined>>({});
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadingTag, setCurrentUploadingTag] = useState<string | null>(null);
    const [isUploadingAll, setIsUploadingAll] = useState(false);
    
    const [draggingTag, setDraggingTag] = useState<string | null>(null);
    const [dragOverTag, setDragOverTag] = useState<string | null>(null);

    useEffect(() => {
        const imageRegex = /\*\*\*이미지\d+\*\*\*/g;
        const matches = markdownInput.match(imageRegex);
        const uniqueMatches = matches ? [...new Set(matches)].sort() : [];

        if (JSON.stringify(extractedImages) !== JSON.stringify(uniqueMatches)) {
            setExtractedImages(uniqueMatches);
            
            setLocalUrls(prev => {
                const next: Record<string, string | undefined> = {};
                uniqueMatches.forEach(tag => {
                    next[tag] = prev[tag] || undefined;
                });
                return next;
            });
        }
    }, [markdownInput, extractedImages]);

    const uploadImage = useCallback(async (file: File, imageTag: string): Promise<void> => {
        const oldUrl = localUrls[imageTag];
        setCurrentUploadingTag(imageTag); // 현재 어떤 태그가 업로드 중인지 표시

        try {
            const { url: newUrl, key: newKey } = await uploadMutation.mutateAsync(file);

            if (oldUrl) {
                const oldKey = extractKeyFromUrl(oldUrl);
                if (oldKey && oldKey !== newKey) {
                    deleteMutation.mutate(oldKey, {
                        onError: (deleteError) => {
                            console.error(`Failed to delete old image (key: ${oldKey}):`, deleteError);
                        }
                    });
                }
            }
            setLocalUrls(prev => ({ ...prev, [imageTag]: newUrl }));
        } catch (error) {
            console.error(`Upload failed for tag ${imageTag}:`, error);
            throw error;
        } finally {
            setCurrentUploadingTag(null); // 업로드 프로세스(성공/실패) 종료
        }
    }, [localUrls, uploadMutation, deleteMutation]);

    const cleanupAfterSelection = useCallback(() => {
        setIsUploadingAll(false);
        if (fileInputRef.current) {
            fileInputRef.current.removeAttribute('multiple');
            fileInputRef.current.value = ''; // 선택된 파일 초기화
        }
    }, []);
    
    const handleFileSelected = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) {
            cleanupAfterSelection();
            return;
        }

        if (isUploadingAll) {
            const pendingTags = extractedImages.filter(tag => !localUrls[tag]);
            const filesToUpload = Array.from(files).slice(0, pendingTags.length);
            
            const uploadPromises = filesToUpload.map((file, i) => uploadImage(file, pendingTags[i]));
            
            try {
                await Promise.all(uploadPromises);
            } catch (error) {
                console.error('One or more uploads failed during bulk upload.', error);
                alert('일부 파일 업로드에 실패했습니다. 확인해주세요.');
            }
        } else if (currentUploadingTag) {
            await uploadImage(files[0], currentUploadingTag);
        }
        cleanupAfterSelection();
    }, [isUploadingAll, currentUploadingTag, extractedImages, localUrls, uploadImage, cleanupAfterSelection]);
    
    const handleUploadSingleClick = useCallback((imageTag: string) => {
        setIsUploadingAll(false);
        setCurrentUploadingTag(imageTag);
        fileInputRef.current?.click();
    }, []);

    const handleUploadAll = useCallback(() => {
        const pendingTagsCount = extractedImages.filter(tag => !localUrls[tag]).length;
        if (pendingTagsCount === 0) {
            alert('업로드할 이미지가 없습니다.');
            return;
        }
        setIsUploadingAll(true);
        setCurrentUploadingTag(null);
        if (fileInputRef.current) {
            fileInputRef.current.setAttribute('multiple', 'true');
            fileInputRef.current.click();
        }
    }, [extractedImages, localUrls]);

    const handleDragStart = useCallback((e: React.DragEvent<HTMLElement>, tag: string) => {
        if (!localUrls[tag]) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('text/plain', tag);
        e.dataTransfer.effectAllowed = 'move';
        setDraggingTag(tag);
    }, [localUrls]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLElement>, targetTag: string) => {
        e.preventDefault();
        const sourceTag = e.dataTransfer.getData('text/plain');
        if (sourceTag && targetTag && sourceTag !== targetTag) {
            setLocalUrls(prev => {
                const newUrls = { ...prev };
                [newUrls[sourceTag], newUrls[targetTag]] = [newUrls[targetTag], newUrls[sourceTag]];
                return newUrls;
            });
        }
        setDraggingTag(null);
        setDragOverTag(null);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>, tag: string) => {
        e.preventDefault();
        if (tag !== draggingTag) {
            setDragOverTag(tag);
        }
    }, [draggingTag]);
    
    const handleDragLeave = useCallback(() => setDragOverTag(null), []);
    const handleDragEnd = useCallback(() => {
        setDraggingTag(null);
        setDragOverTag(null);
    }, []);

    const { uploadStatuses, uploadedUrls, uploadErrors } = useMemo(() => {
        const statuses: Record<string, UploadStatus> = {};
        const errors: Record<string, string | null> = {};

        extractedImages.forEach(tag => {
            if (currentUploadingTag === tag && uploadMutation.isPending) {
                statuses[tag] = 'loading';
            } else if (localUrls[tag]) {
                statuses[tag] = 'success';
            } else if (currentUploadingTag === tag && uploadMutation.isError) {
                statuses[tag] = 'error';
                errors[tag] = uploadMutation.error?.message || 'Unknown upload error';
            } else {
                statuses[tag] = 'idle';
            }
        });

        return { uploadStatuses: statuses, uploadedUrls: localUrls, uploadErrors: errors };
    }, [extractedImages, localUrls, currentUploadingTag, uploadMutation.isPending, uploadMutation.isError, uploadMutation.error]);

    const pendingUploadCount = useMemo(() => extractedImages.filter(tag => !localUrls[tag]).length, [extractedImages, localUrls]);
    const canApply = useMemo(() => extractedImages.length > 0 && extractedImages.every(tag => !!localUrls[tag]), [extractedImages, localUrls]);

    return {
        extractedImages,
        uploadStatuses,
        uploadedUrls,
        uploadErrors,
        fileInputRef,
        draggingTag,
        dragOverTag,
        pendingUploadCount,
        canApply,
        handleFileSelected,
        onUploadSingle: handleUploadSingleClick,
        onUploadAll: handleUploadAll,
        onDragStart: handleDragStart,
        onDrop: handleDrop,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDragEnd: handleDragEnd,
    };
}
----- ./react/features/image-upload/model/useImageUploadWithRQ.ts -----
import { useMutation } from '@tanstack/react-query';
import { uploadImageAPI, deleteImageAPI, type UploadResponse } from '../api/imageApi';

/**
 * 이미지 업로드를 위한 React Query Mutation
 */
export function useUploadImageMutation() {
    return useMutation<UploadResponse, Error, File>({
        mutationFn: (file) => uploadImageAPI(file),
    });
}

/**
 * 이미지 삭제를 위한 React Query Mutation
 */
export function useDeleteImageMutation() {
    return useMutation<void, Error, string>({
        mutationFn: (key) => deleteImageAPI(key),
    });
}
----- ./react/features/image-upload/ui/ImageManager.tsx -----
import React from 'react';
import './ImageManager.css'; 

type UploadStatus = 'idle' | 'loading' | 'success' | 'error';

interface ImageManagerProps {
    extractedImages: string[];
    uploadStatuses: Record<string, UploadStatus>;
    uploadedUrls: Record<string, string | undefined>;
    uploadErrors: Record<string, string | null>;
    pendingUploadCount: number;
    canApply: boolean;
    draggingTag: string | null;
    dragOverTag: string | null;
    onUploadSingle: (tag: string) => void;
    onUploadAll: () => void;
    onApplyUrls: () => void;
    onDragStart: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDrop: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDragOver: (e: React.DragEvent<HTMLElement>, tag: string) => void;
    onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
    onDragEnd: (e: React.DragEvent<HTMLElement>) => void;
}

const ImageManager: React.FC<ImageManagerProps> = ({
    extractedImages, uploadStatuses, uploadedUrls, uploadErrors,
    pendingUploadCount, canApply, draggingTag, dragOverTag,
    onUploadSingle, onUploadAll, onApplyUrls,
    onDragStart, onDrop, onDragOver, onDragLeave, onDragEnd,
}) => {

    if (extractedImages.length === 0) {
        return (
            <div className="image-manager-panel">
                <h2 className="panel-title">이미지 관리</h2>
                <div className="panel-content empty-content">
                    <code>***이미지n***</code> 형식의 참조를 찾을 수 없습니다.
                </div>
            </div>
        );
    }
    
    return (
        <div className="image-manager-panel">
            <h2 className="panel-title">이미지 관리</h2>
            <div className="panel-content">
                <table className="image-table">
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>미리보기</th>
                            <th className="actions-header">
                                <div className="header-buttons">
                                    <button onClick={onUploadAll} disabled={pendingUploadCount === 0} className="action-button">
                                        전체 업로드 ({pendingUploadCount})
                                    </button>
                                    <button onClick={onApplyUrls} disabled={!canApply} className="action-button">
                                        에디터에 적용
                                    </button>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {extractedImages.map(tag => {
                            const status = uploadStatuses[tag] || 'idle';
                            const url = uploadedUrls[tag];
                            const error = uploadErrors[tag];
                            const isDraggable = !!url || status === 'loading';

                            const getRowClassName = () => {
                                let className = 'image-table-row';
                                if (dragOverTag === tag) className += ' drag-over';
                                return className;
                            };

                            return (
                                <tr
                                    key={tag}
                                    className={getRowClassName()}
                                    onDragOver={(e) => onDragOver(e, tag)}
                                    onDragLeave={onDragLeave}
                                    onDrop={(e) => onDrop(e, tag)}
                                    onDragEnd={onDragEnd}
                                >
                                    <td className="tag-name">{tag.slice(3, -3)}</td>
                                    <td
                                        draggable={isDraggable}
                                        onDragStart={(e) => onDragStart(e, tag)}
                                        className={`preview-cell ${isDraggable ? 'draggable' : ''} ${draggingTag === tag ? 'dragging' : ''}`}
                                    >
                                        <div className="preview-box">
                                            {url ? (
                                                <img src={url} alt={`Preview for ${tag}`} />
                                            ) : status === 'loading' ? (
                                                <span>로딩중...</span>
                                            ) : (
                                                <span>(대기)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="actions-cell">
                                        {status !== 'success' ? (
                                            <button onClick={() => onUploadSingle(tag)} disabled={status === 'loading'} className="action-button">
                                                {status === 'loading' ? '업로드 중...' : '업로드'}
                                            </button>
                                        ) : (
                                            <button onClick={() => onUploadSingle(tag)} className="action-button">
                                                변경
                                            </button>
                                        )}
                                        {url && (
                                            <div className="url-display">
                                                <a href={url} target="_blank" rel="noopener noreferrer" title={url}>
                                                    {url.length > 25 ? `${url.slice(0, 25)}...` : url}
                                                </a>
                                            </div>
                                        )}
                                        {error && <div className="error-display" title={error}>{error}</div>}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ImageManager;
----- ./react/features/kakaologin/ui/SignInPanel.tsx -----
import React from 'react';
import { useAuthStore } from '../../../shared/store/authStore'; // authStore import

export const SignInPanel: React.FC = () => {
  const signInWithKakao = useAuthStore(state => state.signInWithKakao);
  const isLoadingAuth = useAuthStore(state => state.isLoadingAuth);
  const authError = useAuthStore(state => state.authError);
  const clearAuthError = useAuthStore.getState().clearAuthError;


  const handleSignIn = async () => {
    if (authError) { // 이전 에러가 있다면 클리어
      clearAuthError();
    }
    await signInWithKakao();
  };



  return (
    <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', marginTop: '10px' }}>
      <h4>로그인</h4>
      <p>
        아직 로그인하지 않으셨습니다. <br/>
        아래 버튼을 통해 카카오 계정으로 로그인할 수 있습니다.
      </p>
      <button
        type="button"
        onClick={handleSignIn}
        style={{ padding: '8px 12px' }}
        disabled={isLoadingAuth} // 로딩 중에는 비활성화
      >
        {isLoadingAuth ? '처리 중...' : '카카오 계정으로 로그인 (Supabase SDK)'}
      </button>
      {/* authError를 여기서 직접 보여줄 수도 있습니다. */}
      {authError && !isLoadingAuth && ( // 로딩 중이 아닐 때만 에러 표시
        <p style={{ color: 'red', marginTop: '10px' }}>
          로그인 오류: {authError}
        </p>
      )}
    </div>
  );
};

----- ./react/features/kakaologin/ui/SignOutButton.tsx -----
import React from 'react';
import { useAuthStore } from '../../../shared/store/authStore'; // authStore import

export const SignOutButton: React.FC = () => {
  const signOut = useAuthStore(state => state.signOut);
  const isLoadingAuth = useAuthStore(state => state.isLoadingAuth);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div style={{ padding: '10px', border: '1px solid #eee', borderRadius: '4px', marginTop: '10px' }}>
      <h4>로그아웃</h4>
      {/* {user && <p>환영합니다, {user.email || '사용자'}님!</p>} */}
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isLoadingAuth} // 로딩 중에는 비활성화
        style={{ padding: '8px 12px' }}
      >
        {isLoadingAuth ? '처리 중...' : '로그아웃'}
      </button>
    </div>
  );
};

----- ./react/features/popovermenu/ProfileMenuContent.tsx -----
import React from 'react';
import { Link, useNavigate } from 'react-router'; // react-router-dom에서 useNavigate 가져오기
import { LuUser, LuSettings, LuLogIn, LuLogOut } from 'react-icons/lu';
import { useAuthStore, selectIsAuthenticated, selectUser, selectIsLoadingAuth } from '../../shared/store/authStore';

interface ProfileMenuContentProps {
    onClose?: () => void;
}

const styles = {
    popoverContent: { minWidth: '200px', backgroundColor: 'var(--glass-base-bg, rgba(255, 255, 255, 0.8))', backdropFilter: 'blur(10px)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', overflow: 'hidden', } as React.CSSProperties,
    userInfoSection: { padding: '12px 16px', borderBottom: '1px solid var(--border-color-light, rgba(0, 0, 0, 0.1))', } as React.CSSProperties,
    userName: { margin: 0, fontWeight: 600, fontSize: '15px', color: 'var(--text-color-primary, #333)', } as React.CSSProperties,
    userEmail: { margin: '4px 0 0', fontSize: '13px', color: 'var(--text-color-secondary, #777)', } as React.CSSProperties,
    menuList: { listStyle: 'none', margin: 0, padding: '8px 0', } as React.CSSProperties,
    menuItemLi: { padding: '0', } as React.CSSProperties,
    commonMenuItem: { display: 'flex', alignItems: 'center', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--text-color-primary, #333)', textDecoration: 'none', } as React.CSSProperties,
    menuItemIcon: { marginRight: '12px', flexShrink: 0, } as React.CSSProperties,
    menuItemText: { flexGrow: 1, } as React.CSSProperties,
};


const ProfileMenuContent: React.FC<ProfileMenuContentProps> = ({ onClose }) => {
    const navigate = useNavigate();
    
    const isAuthenticated = useAuthStore(selectIsAuthenticated);
    const user = useAuthStore(selectUser);
    const isLoading = useAuthStore(selectIsLoadingAuth);
    const signOut = useAuthStore((state) => state.signOut); // signOut 액션을 가져옵니다.

    const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

    const handleClose = () => {
        if (onClose) {
            onClose();
        }
    };

    const handleLoginClick = () => {
        navigate('/login');
        handleClose();
    };

    const handleLogoutClick = async () => {
        try {
            await signOut(); // 스토어의 signOut 함수 호출 (내부적으로 supabase.auth.signOut() 실행)
            
            navigate('/login', { replace: true }); // 로그인 페이지로 이동
        } catch (error) {
            console.error("[ProfileMenuContent] Error during sign out:", error);
            navigate('/login', { replace: true });
        } finally {
            handleClose(); // 팝오버 닫기
        }
    };

    const getMenuItemStyle = (itemName: string): React.CSSProperties => ({
        ...styles.commonMenuItem,
        backgroundColor: hoveredItem === itemName ? 'var(--hover-bg-color-light, rgba(0, 0, 0, 0.05))' : 'transparent',
        transition: 'background-color 0.2s ease-in-out',
    });

    if (isLoading) {
        return <div style={{ ...styles.popoverContent, padding: '20px', textAlign: 'center' }}><p>로딩 중...</p></div>;
    }

    return (
        <div style={styles.popoverContent}>
            {/* [수정 5] 인증 상태 확인 로직을 새로운 상태값으로 변경합니다. */}
            {isAuthenticated && user ? (
                <>
                    <div style={styles.userInfoSection}>
                        {/* [수정 6] Supabase user 객체 구조에 맞게 사용자 이름 접근 방식을 수정합니다. */}
                        <p style={styles.userName}>{user.user_metadata?.name || user.user_metadata?.full_name || '사용자'}</p>
                        <p style={styles.userEmail}>{user.email}</p>
                    </div>
                    <ul style={styles.menuList}>
                        <li style={styles.menuItemLi}>
                            <Link to="/profile" style={getMenuItemStyle('profile')} onClick={handleClose} onMouseEnter={() => setHoveredItem('profile')} onMouseLeave={() => setHoveredItem(null)} aria-label="내 프로필 보기" >
                                <LuUser size={16} style={styles.menuItemIcon} /> <span style={styles.menuItemText}>내 프로필</span>
                            </Link>
                        </li>
                        <li style={styles.menuItemLi}>
                            <Link to="/settings/account" style={getMenuItemStyle('settings')} onClick={handleClose} onMouseEnter={() => setHoveredItem('settings')} onMouseLeave={() => setHoveredItem(null)} aria-label="계정 설정으로 이동" >
                                <LuSettings size={16} style={styles.menuItemIcon} /> <span style={styles.menuItemText}>계정 설정</span>
                            </Link>
                        </li>
                        <li style={styles.menuItemLi}>
                            <button type="button" style={getMenuItemStyle('logout')} onClick={handleLogoutClick} onMouseEnter={() => setHoveredItem('logout')} onMouseLeave={() => setHoveredItem(null)} aria-label="로그아웃" >
                                <LuLogOut size={16} style={styles.menuItemIcon} /> <span style={styles.menuItemText}>로그아웃</span>
                            </button>
                        </li>
                    </ul>
                </>
            ) : (
                <ul style={styles.menuList}>
                    <li style={styles.menuItemLi}>
                        <button type="button" style={getMenuItemStyle('login')} onClick={handleLoginClick} onMouseEnter={() => setHoveredItem('login')} onMouseLeave={() => setHoveredItem(null)} aria-label="로그인" >
                            <LuLogIn size={16} style={styles.menuItemIcon} /> <span style={styles.menuItemText}>로그인</span>
                        </button>
                    </li>
                </ul>
            )}
        </div>
    );
};

export default ProfileMenuContent;
----- ./react/features/row-selection/model/useRowSelection.ts -----
import { useState, useCallback, useMemo } from 'react';

interface UseRowSelectionProps<T extends string | number> {
    initialSelectedIds?: Set<T>;
    allItems?: T[]; 
}

interface UseRowSelectionReturn<T extends string | number> {
    selectedIds: Set<T>;
    toggleRow: (id: T) => void;
    isRowSelected: (id: T) => boolean;
    toggleSelectAll: () => void;
    isAllSelected: boolean;
    clearSelection: () => void;
    toggleItems: (ids: T[]) => void; // [추가] 부분 선택/해제 함수
}

export function useRowSelection<T extends string | number>({
    initialSelectedIds = new Set<T>(),
    allItems = [],
}: UseRowSelectionProps<T> = {}): UseRowSelectionReturn<T> {
    const [selectedIds, setSelectedIds] = useState<Set<T>>(initialSelectedIds);

    const toggleRow = useCallback((id: T) => {
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    }, []);

    const isRowSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isAllSelected = useMemo(() => {
        if (allItems.length === 0) return false;
        return allItems.every(id => selectedIds.has(id));
    }, [allItems, selectedIds]);

    const toggleSelectAll = useCallback(() => {
        if (allItems.length === 0) return;

        if (isAllSelected) {
            const newSelectedIds = new Set(selectedIds);
            allItems.forEach(id => newSelectedIds.delete(id));
            setSelectedIds(newSelectedIds);
        } else {
            const newSelectedIds = new Set(selectedIds);
            allItems.forEach(id => newSelectedIds.add(id));
            setSelectedIds(newSelectedIds);
        }
    }, [allItems, isAllSelected, selectedIds]);

    const toggleItems = useCallback((idsToToggle: T[]) => {
        if (idsToToggle.length === 0) return;

        const allFilteredAreSelected = idsToToggle.every(id => selectedIds.has(id));
        
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (allFilteredAreSelected) {
                idsToToggle.forEach(id => newSelected.delete(id));
            } else {
                idsToToggle.forEach(id => newSelected.add(id));
            }
            return newSelected;
        });
    }, [selectedIds]);

    return {
        selectedIds,
        toggleRow,
        isRowSelected,
        toggleSelectAll,
        isAllSelected,
        clearSelection,
        toggleItems, // [추가]
    };
}
----- ./react/features/student-actions/ui/StudentActionButtons.tsx -----
import React from 'react';
import { LuPencil, LuBookUser, LuCircleArrowOutDownRight } from 'react-icons/lu';
import Tippy from '@tippyjs/react';
import './StudentActionButtons.css';
import StudentStatusChanger from '../../student-status-changer/ui/StudentStatusChanger';
import type { Student } from '../../../entities/student/model/useStudentDataWithRQ';

type StatusValue = Student['status'];

interface StudentActionButtonsProps {
    studentId: string;
    studentName: string;
    isEditing: boolean;
    onEdit: () => void;
    onNavigate: () => void;
    onToggleStatusEditor: () => void;
    onStatusUpdate: (id: string, status: StatusValue | 'delete') => void;
    onCancel: () => void;
}

const StudentActionButtons: React.FC<StudentActionButtonsProps> = ({
    studentId,
    studentName,
    isEditing,
    onEdit,
    onNavigate,
    onToggleStatusEditor,
    onStatusUpdate,
    onCancel,
}) => {
    if (isEditing) {
        return <StudentStatusChanger studentId={studentId} onStatusSelect={onStatusUpdate} onCancel={onCancel} />;
    }

    return (
        <div className="action-cell-buttons">
            {/* 1. 수정 아이콘 */}
            <Tippy content="수정" theme="custom-glass" placement="top">
                <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    aria-label={`${studentName} 학생 정보 수정`}>
                    <LuPencil size={16} color="#3498db" />
                </button>
            </Tippy>
            {/* 2. 상세보기 아이콘 */}
            <Tippy content="상세 보기" theme="custom-glass" placement="top">
                 <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                    aria-label={`${studentName} 학생 상세 정보 보기`}>
                    <LuBookUser size={16} color="#3498db" />
                </button>
            </Tippy>
            {/* 3. 상태 변경(퇴원 처리 등) 아이콘 */}
            <Tippy content="상태 변경" theme="custom-glass" placement="top">
                <button type="button" className="action-icon-button"
                    onClick={(e) => { e.stopPropagation(); onToggleStatusEditor(); }}
                    aria-label={`${studentName} 학생 상태 변경`}>
                    <LuCircleArrowOutDownRight size={16} color="#3498db" />
                </button>
            </Tippy>
        </div>
    );
};

export default StudentActionButtons;
----- ./react/features/student-editing/ui/StudentEditForm.tsx -----
import React, { useState, useEffect, useMemo } from 'react';
import { 
    useStudentDataWithRQ, 
    type Student, 
    type UpdateStudentInput, 
    GRADE_LEVELS 
} from '../../../entities/student/model/useStudentDataWithRQ';
import CategoryInput from '../../student-registration/ui/CategoryInput';
import '../../student-registration/ui/StudentRegistrationForm.css';

interface StudentEditFormProps {
    student: Student;
    onSuccess: () => void;
}

const statusOptions: Student['status'][] = ['재원', '휴원', '퇴원'];

const getUniqueValues = <T extends object, K extends keyof T>(items: T[], key: K): (string | number)[] => {
    if (!items || items.length === 0) { // 오타 수정
        return [];
    }

    const uniqueValues = items.reduce((acc: Set<string | number>, item) => {
        const value = item[key];
        if (typeof value === 'string' && value.trim() !== '') {
            acc.add(value);
        } else if (typeof value === 'number') {
            acc.add(value);
        }
        return acc;
    }, new Set<string | number>());

    return Array.from(uniqueValues);
};


const StudentEditForm: React.FC<StudentEditFormProps> = ({ student, onSuccess }) => {
    const { students, updateStudent, updateStudentStatus } = useStudentDataWithRQ();

    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [className, setClassName] = useState('');
    const [subject, setSubject] = useState('');
    const [teacher, setTeacher] = useState('');
    const [status, setStatus] = useState<Student['status']>('재원');
    const [studentPhone, setStudentPhone] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tuition, setTuition] = useState('');

    const uniqueClassNames = useMemo(() => getUniqueValues(students, 'class_name').sort(), [students]);
    const uniqueSubjects = useMemo(() => getUniqueValues(students, 'subject').sort(), [students]);
    const uniqueSchoolNames = useMemo(() => getUniqueValues(students, 'school_name').sort(), [students]);
    const uniqueTeachers = useMemo(() => getUniqueValues(students, 'teacher').sort(), [students]);
    
    useEffect(() => {
        if (student) {
            setName(student.student_name);
            setGrade(student.grade);
            setClassName(student.class_name || '');
            setSubject(student.subject);
            setStatus(student.status);
            setTeacher(student.teacher || '');
            setStudentPhone(student.student_phone || '');
            setGuardianPhone(student.guardian_phone || '');
            setSchoolName(student.school_name || '');
            setTuition(String(student.tuition || ''));
        }
    }, [student]);

    useEffect(() => {
        if (updateStudentStatus.isSuccess) {
            onSuccess();
        }
    }, [updateStudentStatus.isSuccess, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const updatedData: UpdateStudentInput = {
            id: student.id,
            student_name: name.trim(),
            grade: grade.trim(),
            class_name: className.trim() || null,
            subject: subject.trim(),
            teacher: teacher.trim() || null,
            status: status,
            student_phone: studentPhone.trim() || null,
            guardian_phone: guardianPhone.trim() || null,
            school_name: schoolName.trim() || null,
            tuition: tuition ? Number(String(tuition).replace(/,/g, '')) : 0,
        };
        try {
            await updateStudent(updatedData);
        } catch (err) {
            console.error('Failed to update student:', err);
        }
    };
    
    return (
        <div className="student-registration-container">
            <h4 className="registration-form-title">학생 정보 수정</h4>
            <form onSubmit={handleSubmit} className="registration-form" noValidate>
                <div className="form-group">
                    <label htmlFor="student-name-edit" className="form-label">이름 *</label>
                    <input id="student-name-edit" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" />
                </div>
                
                <CategoryInput
                    label="상태"
                    value={status}
                    onChange={(newStatus) => setStatus(newStatus as Student['status'])}
                    suggestions={statusOptions}
                    hideInput={true}
                />
                
                <CategoryInput
                    label="학년"
                    value={grade}
                    onChange={setGrade}
                    suggestions={GRADE_LEVELS}
                    hideInput={true}
                />

                <CategoryInput 
                    label="반" 
                    value={className} 
                    onChange={setClassName} 
                    suggestions={uniqueClassNames} 
                    placeholder="직접 입력 (예: 1반, 심화반)"
                />

                <CategoryInput 
                    label="과목" 
                    value={subject} 
                    onChange={setSubject} 
                    suggestions={uniqueSubjects} 
                    placeholder="직접 입력 (예: 수학, 영어)"
                />
                <CategoryInput 
                    label="담당 강사" 
                    value={teacher} 
                    onChange={setTeacher} 
                    suggestions={uniqueTeachers} 
                    placeholder="직접 입력 (예: 김리액)"
                />
                <CategoryInput 
                    label="학생 연락처" 
                    value={studentPhone} 
                    onChange={setStudentPhone} 
                    suggestions={[]} 
                    placeholder="010-1234-5678" 
                    type="tel"
                />
                <CategoryInput 
                    label="학부모 연락처" 
                    value={guardianPhone} 
                    onChange={setGuardianPhone} 
                    suggestions={[]} 
                    placeholder="010-9876-5432" 
                    type="tel"
                />
                <CategoryInput 
                    label="학교명" 
                    value={schoolName} 
                    onChange={setSchoolName} 
                    suggestions={uniqueSchoolNames} 
                    placeholder="직접 입력 (예: OO고등학교)"
                />
                <CategoryInput 
                    label="수강료" 
                    value={tuition} 
                    onChange={setTuition} 
                    suggestions={[]} 
                    placeholder="직접 입력 (숫자만)" 
                    type="text"
                />
                <div className="form-actions">
                    {updateStudentStatus.isError && <p className="form-error-message">수정 실패: {updateStudentStatus.error?.message}</p>}
                    <button type="submit" className="submit-button" disabled={updateStudentStatus.isPending || !name}>
                        {updateStudentStatus.isPending ? '저장 중...' : '변경 내용 저장'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentEditForm;
----- ./react/features/student-registration/ui/CategoryInput.tsx -----
import React from 'react';
import './CategoryInput.css';

interface CategoryInputProps {
    label: string;
    value: string;
    suggestions: (string | number)[];
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'number' | 'tel';
    required?: boolean;
    hideInput?: boolean; 
}

const CategoryInput: React.FC<CategoryInputProps> = ({
    label,
    value,
    suggestions,
    onChange,
    placeholder,
    type = 'text',
    required = false,
    hideInput = false, 
}) => {
    return (
        <div className="category-input-group">
            <label className="form-label">{label} {required && '*'}</label>
            <div className="category-suggestions">
                {suggestions.map((suggestion) => (
                    <button
                        type="button"
                        key={suggestion}
                        className={`suggestion-button ${String(value) === String(suggestion) ? 'active' : ''}`}
                        onClick={() => onChange(String(suggestion))}
                    >
                        {label === '수강료' && typeof suggestion === 'number' ? suggestion.toLocaleString() : suggestion}
                    </button>
                ))}
            </div>
            
            {!hideInput && (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="form-input"
                    required={required}
                />
            )}
        </div>
    );
};

export default CategoryInput;
----- ./react/features/student-registration/ui/StudentRegistrationForm.tsx -----
import React, { useState, useMemo, useEffect } from 'react';
import { useStudentDataWithRQ, type CreateStudentInput, GRADE_LEVELS } from '../../../entities/student/model/useStudentDataWithRQ';
import CategoryInput from './CategoryInput';
import './StudentRegistrationForm.css';
import { LuUserPlus } from 'react-icons/lu';

interface StudentRegistrationFormProps {
    onSuccess?: () => void;
}

const getUniqueValues = <T extends object, K extends keyof T>(items: T[], key: K): (string | number)[] => {
    if (!items || items.length === 0) { // 오타 수정
        return [];
    }

    const uniqueValues = items.reduce((acc: Set<string | number>, item) => {
        const value = item[key];
        if (typeof value === 'string' && value.trim() !== '') {
            acc.add(value);
        } else if (typeof value === 'number') {
            acc.add(value);
        }
        return acc;
    }, new Set<string | number>());

    return Array.from(uniqueValues);
};


const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ onSuccess }) => {
    const { students, addStudent, addStudentStatus } = useStudentDataWithRQ();

    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [subject, setSubject] = useState('');
    const [className, setClassName] = useState('');
    const [teacher, setTeacher] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tuition, setTuition] = useState('');

    const uniqueClassNames = useMemo(() => getUniqueValues(students, 'class_name').sort(), [students]);
    const uniqueSubjects = useMemo(() => getUniqueValues(students, 'subject').sort(), [students]);
    const uniqueSchoolNames = useMemo(() => getUniqueValues(students, 'school_name').sort(), [students]);
    const uniqueTuitions = useMemo(() => getUniqueValues(students, 'tuition').sort((a,b) => (a as number) - (b as number)), [students]);
    const uniqueTeachers = useMemo(() => getUniqueValues(students, 'teacher').sort(), [students]);

    const resetForm = () => {
        setName(''); setGrade(''); setSubject(''); setClassName(''); setTeacher('');
        setStudentPhone(''); setGuardianPhone(''); setSchoolName(''); setTuition('');
    };
    
    useEffect(() => {
        if (addStudentStatus.isSuccess) {
            resetForm();
            if (onSuccess) {
                onSuccess();
            }
        }
    }, [addStudentStatus.isSuccess, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newStudent: CreateStudentInput = {
            student_name: name.trim(),
            grade: grade.trim(),
            class_name: className.trim() || null,
            subject: subject.trim(),
            teacher: teacher.trim() || null,
            student_phone: studentPhone.trim() || null,
            guardian_phone: guardianPhone.trim() || null,
            school_name: schoolName.trim() || null,
            tuition: tuition ? Number(String(tuition).replace(/,/g, '')) : 0,
            status: '재원',
        };
        try {
            await addStudent(newStudent);
        } catch (err) {
            console.error('Failed to add student:', err);
        }
    };

    return (
        <div className="student-registration-container">
            <h4 className="registration-form-title">
                <LuUserPlus size={18} />
                <span>신입생 등록</span>
            </h4>
            <form onSubmit={handleSubmit} className="registration-form" noValidate>
                <div className="form-group">
                    <label htmlFor="student-name" className="form-label">이름 *</label>
                    <input id="student-name" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" placeholder="학생 이름을 입력하세요"/>
                </div>
                <CategoryInput 
                    label="학년"
                    value={grade}
                    onChange={setGrade}
                    suggestions={GRADE_LEVELS}
                    hideInput={true}
                />
                <CategoryInput label="반" value={className} onChange={setClassName} suggestions={uniqueClassNames} placeholder="직접 입력 (예: 1반, 심화반)"/>
                <CategoryInput label="과목" value={subject} onChange={setSubject} suggestions={uniqueSubjects} placeholder="직접 입력 (예: 수학, 영어)"/>
                <CategoryInput label="담당 강사" value={teacher} onChange={setTeacher} suggestions={uniqueTeachers} placeholder="직접 입력 (예: 김리액)"/>
                <CategoryInput label="학생 연락처" value={studentPhone} onChange={setStudentPhone} suggestions={[]} placeholder="010-1234-5678" type="tel"/>
                <CategoryInput label="학부모 연락처" value={guardianPhone} onChange={setGuardianPhone} suggestions={[]} placeholder="010-9876-5432" type="tel"/>
                <CategoryInput label="학교명" value={schoolName} onChange={setSchoolName} suggestions={uniqueSchoolNames} placeholder="직접 입력 (예: OO고등학교)"/>
                <CategoryInput label="수강료" value={tuition} onChange={setTuition} suggestions={uniqueTuitions} placeholder="직접 입력 (숫자만)" type="text"/>

                <div className="form-actions">
                    {addStudentStatus.isError && (
                        <p className="form-error-message">등록 실패: {addStudentStatus.error?.message}</p>
                    )}
                    <button type="submit" className="submit-button" disabled={addStudentStatus.isPending || !name.trim()}>
                        {addStudentStatus.isPending ? '등록 중...' : '학생 등록하기'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentRegistrationForm;
----- ./react/features/student-status-changer/ui/StudentStatusChanger.tsx -----
import React from 'react';
import Badge from '../../../shared/ui/Badge/Badge';
import type { Student } from '../../../entities/student/model/useStudentDataWithRQ';
import './StudentStatusChanger.css';
import { LuUndo2 } from 'react-icons/lu';
import Tippy from '@tippyjs/react';

type StatusValue = Student['status'];

interface StudentStatusChangerProps {
    studentId: string;
    onStatusSelect: (studentId: string, status: StatusValue | 'delete') => void;
    onCancel: () => void; // [추가] 취소 함수를 위한 prop
}

const StudentStatusChanger: React.FC<StudentStatusChangerProps> = ({ studentId, onStatusSelect, onCancel }) => {
    const statuses: { label: string, value: StatusValue | 'delete', className: string }[] = [
        { label: '재원', value: '재원', className: 'status-enroll' },
        { label: '휴원', value: '휴원', className: 'status-pause' },
        { label: '퇴원', value: '퇴원', className: 'status-leave' },
        { label: '삭제', value: 'delete', className: 'status-delete' },
    ];

    return (
        <div className="status-changer-container">
            {/* [추가] 뒤로가기(취소) 아이콘 버튼 */}
            <Tippy content="취소" theme="custom-glass" placement="top">
                <button
                    type="button"
                    className="action-icon-button cancel-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onCancel();
                    }}
                    aria-label="상태 변경 취소"
                >
                    <LuUndo2 size={16} />
                </button>
            </Tippy>

            {/* 기존 Badge 그룹 */}
            {statuses.map(({ label, value, className }) => (
                <Badge
                    key={value}
                    className={`clickable-badge ${className}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onStatusSelect(studentId, value);
                    }}
                    role="button"
                    tabIndex={0}
                >
                    {label}
                </Badge>
            ))}
        </div>
    );
};

export default StudentStatusChanger;
----- ./react/features/table-column-toggler/ui/TableColumnToggler.tsx -----
import React from 'react';
import { useUIStore } from '../../../shared/store/uiStore';
import { useColumnPermissions } from '../../../shared/hooks/useColumnPermissions'; // [수정] 신규 훅 import
import { LuEye, LuEyeOff } from 'react-icons/lu';
import './TableColumnToggler.css';


const TableColumnToggler: React.FC = () => {
  const { columnVisibility, toggleColumnVisibility } = useUIStore();
  const { permittedColumnsConfig } = useColumnPermissions();

  return (
    <div className="column-toggler-panel">
      <h4 className="toggler-title">테이블 컬럼 설정</h4>
      <div className="toggler-list">
        {/* [수정] permittedColumnsConfig를 순회하여 버튼 생성 */}
        {permittedColumnsConfig.map((col) => {
          const isVisible = columnVisibility[col.key] ?? true;
          return (
            <button
              key={col.key}
              type="button"
              className={`toggler-button ${isVisible ? 'active' : ''}`}
              onClick={() => toggleColumnVisibility(col.key)}
              aria-pressed={isVisible}
            >
              <span className="button-label">{col.label}</span>
              {isVisible ? (
                <LuEye size={16} className="button-icon" />
              ) : (
                <LuEyeOff size={16} className="button-icon" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TableColumnToggler;
----- ./react/features/table-search/model/useTableSearch.ts -----

import { useMemo } from 'react';

type DataItem = Record<string, any>;

interface UseTableSearchOptions {
    data: DataItem[];
    searchTerm: string; 
    searchableKeys: string[];
    activeFilters: Record<string, string>; 
}

export function useTableSearch({
    data,
    searchTerm,
    searchableKeys,
    activeFilters,
}: UseTableSearchOptions): DataItem[] {
    
    if (!data) {
        return [];
    }
    
    const filteredData = useMemo(() => {
        let items = [...data]; // 이제 data는 항상 배열이므로 이 코드는 안전합니다.

        const filterKeys = Object.keys(activeFilters);
        if (filterKeys.length > 0) {
            items = items.filter(item => {
                return filterKeys.every(key => {
                    return item[key] != null && String(item[key]) === String(activeFilters[key]);
                });
            });
        }

        const terms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (terms.length > 0) {
            items = items.filter(item => {
                const combinedSearchableText = searchableKeys
                    .map(key => item[key])
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase();
                
                return terms.every(term => combinedSearchableText.includes(term));
            });
        }

        return items;
    }, [data, searchTerm, activeFilters, searchableKeys]);

    return filteredData;
}
----- ./react/features/table-search/ui/TableSearch.tsx -----
import React from 'react';
import { LuSearch, LuX, LuRotateCcw, LuCirclePlus, LuListChecks } from 'react-icons/lu';
import './TableSearch.css';

export interface SuggestionGroup {
    key: string;
    suggestions: string[];
}

export interface TableSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    suggestionGroups: SuggestionGroup[];
    activeFilters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    onToggleFiltered: () => void;
    onCreateProblemSet: () => void;
    selectedCount: number;
}

const TableSearch: React.FC<TableSearchProps> = ({
    searchTerm,
    onSearchTermChange,
    suggestionGroups,
    activeFilters,
    onFilterChange,
    onResetFilters,
    onToggleFiltered,
    onCreateProblemSet,
    selectedCount,
}) => {
    const hasActiveFilters = Object.keys(activeFilters).length > 0;
    const hasSuggestions = suggestionGroups.some(g => g.suggestions.length > 0);

    return (
        <div className="table-search-panel">
            {/* 검색 입력창 */}
            <div className="search-input-wrapper">
                <LuSearch className="search-input-icon" size={20} />
                <input
                    type="text"
                    placeholder="검색어를 입력하세요 (예: 고1 수학)"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
            </div>
            
            {/* [수정] 필터 및 액션 버튼들을 포함하는 새로운 메인 그룹 */}
            <div className="filter-actions-container">
                {/* 왼쪽: 필터 칩 영역 */}
                <div className="filter-chips-area">
                    {hasSuggestions && suggestionGroups.map((group) => (
                        group.suggestions.length > 0 && (
                            <div key={group.key} className="suggestion-group">
                                <div className="suggestion-buttons-wrapper">
                                    {group.suggestions.map((suggestion) => {
                                        const isActive = activeFilters[group.key] === suggestion;
                                        return (
                                            <button
                                                key={suggestion}
                                                type="button"
                                                className={`suggestion-chip ${isActive ? 'active' : ''}`}
                                                onClick={() => onFilterChange(group.key, suggestion)}
                                            >
                                                {suggestion}
                                                {isActive && <LuX size={14} className="suggestion-chip-clear" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )
                    ))}
                </div>

                {/* 오른쪽: 액션 버튼 컨트롤 영역 */}
                <div className="action-controls-area">
                    <button
                        type="button"
                        className="control-button primary"
                        onClick={onCreateProblemSet}
                        disabled={selectedCount === 0}
                    >
                        <LuCirclePlus size={16} />
                        <span>문제 출제 ({selectedCount})</span>
                    </button>
                    <button
                        type="button"
                        className="control-button"
                        onClick={onToggleFiltered}
                    >
                        <LuListChecks size={16} />
                        <span>결과 선택</span>
                    </button>
                    <button 
                        type="button" 
                        className="control-button"
                        onClick={onResetFilters}
                        disabled={!hasActiveFilters}
                        title="필터 초기화"
                    >
                        <LuRotateCcw size={16} />
                        <span>초기화</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TableSearch;
----- ./react/main.tsx -----

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css"; 



const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

----- ./react/pages/DashBoard.tsx -----
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLayoutStore } from '../shared/store/layoutStore';
import { useUIStore } from '../shared/store/uiStore';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../entities/student/model/useStudentDataWithRQ';
import { useRowSelection } from '../features/row-selection/model/useRowSelection';

import StudentRegistrationForm from '../features/student-registration/ui/StudentRegistrationForm';
import StudentEditForm from '../features/student-editing/ui/StudentEditForm';
import TableColumnToggler from '../features/table-column-toggler/ui/TableColumnToggler';
import StudentTableWidget from '../widgets/student-table/StudentTableWidget';
import { useTableSearch } from '../features/table-search/model/useTableSearch';
import type { SuggestionGroup } from '../features/table-search/ui/TableSearch';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const getUniqueSortedValues = (items: Student[], key: keyof Student): string[] => {
    if (!items || !Array.isArray(items) || items.length === 0) return [];
    
    const values = items.map(item => item[key]).filter((value): value is string => value != null && String(value).trim() !== '');
    const uniqueValues = Array.from(new Set(values));
    
    if (key === 'grade') {
        return uniqueValues.sort((a, b) => {
            const indexA = GRADE_LEVELS.indexOf(a);
            const indexB = GRADE_LEVELS.indexOf(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
    }

    return uniqueValues.sort();
};

const DashBoard: React.FC = () => {
    const { setRightSidebarContent, setSidebarTriggers } = useLayoutStore.getState();
    const { setRightSidebarExpanded } = useUIStore();
    
    const { students, isLoadingStudents, isStudentsError, studentsError } = useStudentDataWithRQ();
    
    const [activeSidebarView, setActiveSidebarView] = useState<'register' | 'edit' | 'settings' | null>(null);
    const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

    const prevActiveSidebarView = usePrevious(activeSidebarView);

    const currentStudents = students || [];
    const studentIds = useMemo(() => currentStudents.map(s => s.id), [currentStudents]);

    const { selectedIds, toggleRow, toggleItems } = useRowSelection<string>({ allItems: studentIds });

    const filteredStudents = useTableSearch({
        data: currentStudents,
        searchTerm,
        searchableKeys: ['student_name', 'grade', 'subject', 'school_name', 'class_name', 'teacher'],
        activeFilters,
    }) as Student[];
    const filteredStudentIds = useMemo(() => filteredStudents.map(s => s.id), [filteredStudents]);
    
    const isFilteredAllSelected = useMemo(() => {
        if (filteredStudentIds.length === 0) return false;
        return filteredStudentIds.every(id => selectedIds.has(id));
    }, [filteredStudentIds, selectedIds]);
    
    const handleToggleFilteredAll = useCallback(() => {
        toggleItems(filteredStudentIds);
    }, [toggleItems, filteredStudentIds]);


    const suggestionGroups = useMemo((): SuggestionGroup[] => {
        return [
            { key: 'grade', suggestions: getUniqueSortedValues(currentStudents, 'grade') },
            { key: 'subject', suggestions: getUniqueSortedValues(currentStudents, 'subject') },
            { key: 'class_name', suggestions: getUniqueSortedValues(currentStudents, 'class_name') },
        ];
    }, [currentStudents]);
    
    const suggestionGroupsJSON = useMemo(() => JSON.stringify(suggestionGroups), [suggestionGroups]);
    
    const handleFilterChange = useCallback((key: string, value: string) => {
        setActiveFilters(prev => {
            const newFilters = { ...prev };
            if (newFilters[key] === value) {
                delete newFilters[key];
            } else {
                newFilters[key] = value;
            }
            return newFilters;
        });
    }, []);

    const handleResetFilters = useCallback(() => {
        setActiveFilters({});
    }, []);

    const handleToggleFilteredSelection = useCallback(() => {
        toggleItems(filteredStudentIds);
    }, [toggleItems, filteredStudentIds]);

    const handleCreateProblemSet = useCallback(() => {
        if (selectedIds.size === 0) {
            alert('선택된 학생이 없습니다.');
            return;
        }
        console.log('문제 출제 대상 학생 ID:', [...selectedIds]);
        alert(`${selectedIds.size}명의 학생을 대상으로 문제 출제 로직을 실행합니다. (콘솔 확인)`);
    }, [selectedIds]);

    const handleCloseSidebar = useCallback(() => {
        setActiveSidebarView(null);
    }, []);
    
    const handleRequestEdit = useCallback((student: Student) => {
        setStudentToEdit(student);
        setActiveSidebarView('edit');
    }, []);

    const handleOpenRegisterSidebar = useCallback(() => {
        setStudentToEdit(null);
        setActiveSidebarView('register');
    }, []);
    
    const handleOpenSettingsSidebar = useCallback(() => {
        setStudentToEdit(null);
        setActiveSidebarView('settings');
    }, []);

    useEffect(() => {
        setRightSidebarExpanded(activeSidebarView !== null);

        if (activeSidebarView === 'register') {
            setRightSidebarContent(<StudentRegistrationForm onSuccess={handleCloseSidebar} />);
        } else if (activeSidebarView === 'edit' && studentToEdit) {
            setRightSidebarContent(<StudentEditForm student={studentToEdit} onSuccess={handleCloseSidebar} />);
        } else if (activeSidebarView === 'settings') {
            setRightSidebarContent(<TableColumnToggler />);
        }

        if (prevActiveSidebarView !== null && activeSidebarView === null) {
            const timer = setTimeout(() => {
                setRightSidebarContent(null);
                setStudentToEdit(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [activeSidebarView, studentToEdit, handleCloseSidebar, setRightSidebarExpanded, setRightSidebarContent, prevActiveSidebarView]);

    useEffect(() => {
        setSidebarTriggers({
            onRegisterClick: handleOpenRegisterSidebar,
            onSettingsClick: handleOpenSettingsSidebar,
            onClose: handleCloseSidebar,
        });
    }, [handleOpenRegisterSidebar, handleOpenSettingsSidebar, handleCloseSidebar, setSidebarTriggers]);
    
    useEffect(() => {
        useLayoutStore.getState().setStudentSearchProps({
            searchTerm,
            onSearchTermChange: setSearchTerm,
            activeFilters,
            onFilterChange: handleFilterChange,
            onResetFilters: handleResetFilters,
            suggestionGroups: suggestionGroupsJSON,
            onToggleFiltered: handleToggleFilteredSelection,
            onCreateProblemSet: handleCreateProblemSet,
            selectedCount: selectedIds.size,
        });

        return () => {
            useLayoutStore.getState().setStudentSearchProps(null);
        };
    }, [
        searchTerm, 
        activeFilters, 
        suggestionGroupsJSON, 
        selectedIds.size, 
        handleFilterChange, 
        handleResetFilters, 
        handleToggleFilteredSelection, 
        handleCreateProblemSet
    ]);
    
    if (isStudentsError) {
        return (
            <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
                <h2>학생 데이터 로딩 오류</h2>
                <p>{studentsError?.message || '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'}</p>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', height: '100%' }}>
            <StudentTableWidget 
                students={filteredStudents} 
                isLoading={isLoadingStudents}
                onRequestEdit={handleRequestEdit}
                selectedIds={selectedIds}
                toggleRow={toggleRow}
                isAllSelected={isFilteredAllSelected}
                toggleSelectAll={handleToggleFilteredAll}
            />
        </div>
    );
};

export default DashBoard;
----- ./react/pages/example.tsx -----
import { useState } from 'react';

interface TableInfo {
  schemaname: string;
  tablename: string;
  tableowner: string;
  tablespace: string | null;
  hasindexes: boolean;
  hasrules: boolean;
  hastriggers: boolean;
  rowsecurity: boolean;
  [key: string]: any; // 그 외 다른 컬럼들을 위해
}

interface ApiResponse {
  success: boolean;
  result?: TableInfo[];
  error?: string;
}

const ExamplePage: React.FC = () => {
  const [data, setData] = useState<TableInfo[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch('/api/example/pgtables');
      credentials: 'include'
      console.log(response)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const jsonData: ApiResponse = await response.json();

      if (jsonData.success && jsonData.result) {
        setData(jsonData.result);
      } else {
        setError(jsonData.error || 'Failed to fetch data.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>PostgreSQL pg_tables 데이터 조회 예제</h1>
      <button onClick={fetchData} disabled={loading}>
        {loading ? '데이터 로딩 중...' : 'pg_tables 데이터 가져오기'}
      </button>

      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <p>에러 발생:</p>
          <pre>{error}</pre>
        </div>
      )}

      {data && (
        <div style={{ marginTop: '20px' }}>
          <h2>조회된 데이터:</h2>
          {data.length > 0 ? (
            <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '5px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          ) : (
            <p>데이터가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamplePage;
----- ./react/pages/HomePage.tsx -----
import React from "react";

import {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError,
} from "../shared/store/authStore";

import { SignInPanel } from "../features/kakaologin/ui/SignInPanel";
import { SignOutButton } from "../features/kakaologin/ui/SignOutButton";

import { UserDetailsButton } from "../widgets/UserDetailsButton";

const HomePage: React.FC = () => {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
  const authError = useAuthStore(selectAuthError);

  if (isLoadingAuth) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>인증 상태를 확인 중입니다...</h2>
        <p>잠시만 기다려주세요.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1>Hono Supabase Auth Example!</h1>
        {user && <p>환영합니다11, <strong>{user.email || '사용자'}</strong>님!</p>}
      </header>

      <hr style={{ margin: '30px 0' }} />

      <section style={{ marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px' }}>Sign in / Sign out</h2>
        {!isAuthenticated ? <SignInPanel /> : <SignOutButton />}
        {authError && !isLoadingAuth && (
            <p style={{ color: 'red', marginTop: '10px' }}>
                인증 오류: {authError}
            </p>
        )}
      </section>

      <hr style={{ margin: '30px 0' }} />

      {isAuthenticated && user && (
        <>
          <section style={{ marginBottom: '30px' }}>
            <h2 style={{ marginBottom: '15px' }}>Example of API fetch() (Hono Client)</h2>
            <UserDetailsButton />
          </section>

        </>
      )}

      {!isAuthenticated && (
        <p style={{ marginTop: '30px', fontStyle: 'italic', textAlign: 'center' }}>
          더 많은 예제를 보거나 데이터를 가져오려면 로그인해주세요.
        </p>
      )}
    </div>
  );
};

export default HomePage;
----- ./react/pages/LoginPage.tsx -----
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  useAuthStore,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError,
} from '../shared/store/authStore'; // authStore 경로 수정
import BackgroundBlobs from '../widgets/rootlayout/BackgroundBlobs'; // 경로 확인
import './LoginPage.css'; // CSS 파일 경로 확인

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuthGlobal = useAuthStore(selectIsLoadingAuth);
  const authStoreError = useAuthStore(selectAuthError);
  const { signInWithKakao, clearAuthError } = useAuthStore.getState();

  const [isKakaoLoginLoading, setIsKakaoLoginLoading] = useState(false); // 카카오 로그인 버튼 전용 로딩 상태
  const [urlErrorMessage, setUrlErrorMessage] = useState('');

  useEffect(() => {
    if (!isLoadingAuthGlobal && isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuthGlobal, navigate, location.state]);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const errorParam = queryParams.get('error');
    const errorDescriptionParam = queryParams.get('error_description');

    if (errorParam) {
      let message = decodeURIComponent(errorParam);
      if (errorDescriptionParam) {
        message += `: ${decodeURIComponent(errorDescriptionParam)}`;
      }
      setUrlErrorMessage(message);
    }
  }, [location.search]);

  const handleKakaoLogin = async () => {
    if (isKakaoLoginLoading || isLoadingAuthGlobal) return;

    setIsKakaoLoginLoading(true);
    if (authStoreError) clearAuthError();
    setUrlErrorMessage('');

    try {
      await signInWithKakao();
    } catch (e: any) {
      console.error("Kakao login initiation error in component:", e);
    } finally {
    }
  };

  const displayError = authStoreError || urlErrorMessage;
  const isButtonDisabled = isLoadingAuthGlobal || isKakaoLoginLoading;

  if (isLoadingAuthGlobal && !displayError && !isKakaoLoginLoading) {
    return (
      <div className="login-page-wrapper">
        <div className="login-page-container" style={{ textAlign: 'center' }}>
          <p>인증 정보를 확인 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page-wrapper">
      <div className="login-background-blobs-wrapper">
        <BackgroundBlobs />
      </div>
      <div className="login-page-container">
        <div className="login-form-card">
          <h1 className="login-title">로그인</h1>
          <p className="login-subtitle">소셜 계정으로 간편하게 로그인하고<br />모든 기능을 이용해보세요.</p>
          <div className="social-login-buttons-container">
            <button
              type="button"
              className="social-login-button kakao-login-button"
              onClick={handleKakaoLogin}
              disabled={isButtonDisabled}
              aria-label="카카오 계정으로 로그인"
            >
              <svg className="social-login-icon kakao-icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" width="18" height="18">
                <path d="M9 0C4.029 0 0 3.138 0 7C0 9.039 1.206 10.845 3.108 12.015L2.582 14.956C2.529 15.262 2.811 15.513 3.099 15.37L6.091 13.898C6.683 13.961 7.293 14 7.922 14C12.971 14 17 10.862 17 7C17 3.138 12.971 0 7.922 0C7.922 0 9 0 9 0Z" fill="#000000" />
              </svg>
              <span className="social-login-text">
                {isKakaoLoginLoading || (isLoadingAuthGlobal && !isKakaoLoginLoading) ? '처리 중...' : '카카오 계정으로 로그인'}
              </span>
            </button>
            {/* Google 로그인 버튼 제거됨 */}
          </div>
          {displayError && (
            <p className="login-error-message" style={{ color: 'red', marginTop: '15px' }}>{displayError}</p>
          )}
          <p className="login-terms">
            로그인 시 <a href="/terms" target="_blank" rel="noopener noreferrer">이용약관</a> 및 <a href="/privacy" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
----- ./react/pages/LoginPageWithErrorDisplay.tsx -----
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router'; // react-router-dom 훅 사용
import { useAuthStore, selectAuthError, selectIsAuthenticated, selectIsLoadingAuth } from '../shared/store/authStore';

const LoginPageWithErrorDisplay: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlErrorDescription, setUrlErrorDescription] = useState<string | null>(null);

  const authStoreError = useAuthStore(selectAuthError);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
  const clearAuthStoreError = useAuthStore.getState().clearAuthError; // 에러 클리어 액션

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const errorDescriptionParam = params.get('error_description');

    if (errorParam) {
      setUrlError(decodeURIComponent(errorParam));
    }
    if (errorDescriptionParam) {
      setUrlErrorDescription(decodeURIComponent(errorDescriptionParam));
    }

  }, [location.search /*, authStoreError, clearAuthStoreError */]);


  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate('/'); // 또는 이전 페이지나 대시보드로 리다이렉트
    }
  }, [isLoadingAuth, isAuthenticated, navigate]);


  const handleRetryLogin = () => {
    navigate('/test-auth'); // 또는 로그인 시도 페이지
  };

  const displayError = urlError || authStoreError;
  const displayErrorDescription = urlErrorDescription;


  if (isLoadingAuth) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>인증 상태를 확인 중입니다...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '40px auto', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center' }}>
      <h1>로그인</h1>

      {displayError && (
        <div style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '15px', margin: '20px 0', borderRadius: '4px' }}>
          <h2>로그인 오류</h2>
          <p><strong>오류 코드:</strong> {displayError}</p>
          {displayErrorDescription && <p><strong>상세 정보:</strong> {displayErrorDescription}</p>}
          <p>로그인 과정에서 문제가 발생했습니다.</p>
        </div>
      )}

      {!displayError && !isAuthenticated && (
        <p style={{ margin: '20px 0' }}>
          로그인이 필요한 서비스입니다.
        </p>
      )}

      {/* 사용자가 이미 로그인되어 있다면 이 페이지를 볼 이유가 별로 없음 */}
      {/* isAuthenticated 상태에 따라 다른 UI를 보여줄 수도 있음 */}

      <div style={{ marginTop: '30px' }}>
        <button
          onClick={handleRetryLogin}
          style={{ padding: '10px 20px', marginRight: '10px', cursor: 'pointer' }}
        >
          로그인 페이지로 돌아가기
        </button>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button style={{ padding: '10px 20px', cursor: 'pointer' }}>
            홈으로 이동
          </button>
        </Link>
      </div>

      {/* authStore의 에러를 명시적으로 클리어하고 싶다면 버튼 추가 가능
      {authStoreError && (
        <button onClick={clearAuthStoreError} style={{ marginTop: '10px' }}>
          스토어 에러 메시지 지우기
        </button>
      )}
      */}
    </div>
  );
};

export default LoginPageWithErrorDisplay;
----- ./react/pages/ProblemWorkbenchPage.tsx -----
import React, { useState, useCallback } from 'react';
import Editor from '../shared/ui/codemirror-editor/Editor';
import MathpixRenderer from '../shared/ui/MathpixRenderer';
import { useImageUploadManager } from '../features/image-upload/model/useImageUploadManager';
import ImageManager from '../features/image-upload/ui/ImageManager';
import './ProblemWorkbenchPage.css';

const ProblemWorkbenchPage: React.FC = () => {
    const initialContent = `# Mathpix Markdown 에디터에 오신 것을 환영합니다! 👋

이곳에서 Markdown 문법과 함께 LaTeX 수식을 실시간으로 편집하고 미리 볼 수 있습니다.

## 이미지 관리 예시

에디터에 \`***이미지1***\` 처럼 입력하면 오른쪽 패널에 이미지 관리 항목이 나타납니다.
각 항목에 이미지를 업로드하고, 최종적으로 '에디터에 적용' 버튼을 눌러보세요.

***이미지1***
***이미지2***
`;

    const [markdownContent, setMarkdownContent] = useState(initialContent);
    const imageManager = useImageUploadManager(markdownContent);

    const handleContentChange = useCallback((content: string) => {
        setMarkdownContent(content);
    }, []);

    const handleApplyUrls = useCallback(() => {
        const { extractedImages, uploadedUrls } = imageManager;
        let newMarkdown = markdownContent;
        let changesMade = false;

        extractedImages.forEach(tag => {
            const url = uploadedUrls[tag];
            if (url) {
                const tagRegex = new RegExp(tag.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
                newMarkdown = newMarkdown.replace(tagRegex, `![](${url})`);
                changesMade = true;
            }
        });

        if (changesMade) {
            setMarkdownContent(newMarkdown);
            alert('이미지 URL을 에디터에 적용했습니다.');
        } else {
            alert('적용할 변경사항이 없거나, 모든 URL이 준비되지 않았습니다.');
        }
    }, [markdownContent, imageManager]);

    return (
        <div className="problem-workbench-page">
            {/* 파일 입력을 위한 숨겨진 input 요소 */}
            <input
                type="file"
                ref={imageManager.fileInputRef}
                onChange={imageManager.handleFileSelected}
                accept="image/*"
                style={{ display: 'none' }}
            />

            <div className="problem-workbench-layout">
                {/* 패널 1: 에디터 */}
                <div className="workbench-panel editor-panel">
                    <h2 className="panel-title">Markdown & LaTeX 입력</h2>
                    <div className="panel-content editor-content-wrapper">
                        <Editor
                            initialContent={markdownContent}
                            onContentChange={handleContentChange}
                        />
                    </div>
                </div>

                {/* 패널 2: 미리보기 */}
                <div className="workbench-panel preview-panel">
                    <h2 className="panel-title">실시간 미리보기 (Mathpix)</h2>
                    <div className="panel-content preview-content-wrapper prose">
                        <MathpixRenderer text={markdownContent} />
                    </div>
                </div>

                {/* 패널 3: 이미지 관리 */}
                <div className="workbench-panel image-manager-wrapper-panel">
                    <ImageManager
                        extractedImages={imageManager.extractedImages}
                        uploadStatuses={imageManager.uploadStatuses}
                        uploadedUrls={imageManager.uploadedUrls}
                        uploadErrors={imageManager.uploadErrors}
                        pendingUploadCount={imageManager.pendingUploadCount}
                        canApply={imageManager.canApply}
                        draggingTag={imageManager.draggingTag}
                        dragOverTag={imageManager.dragOverTag}
                        onUploadSingle={imageManager.onUploadSingle}
                        onUploadAll={imageManager.onUploadAll}
                        onApplyUrls={handleApplyUrls}
                        onDragStart={imageManager.onDragStart}
                        onDrop={imageManager.onDrop}
                        onDragOver={imageManager.onDragOver}
                        onDragLeave={imageManager.onDragLeave}
                        onDragEnd={imageManager.onDragEnd}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProblemWorkbenchPage;
----- ./react/pages/ProfileSetupPage.tsx -----

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod'; // 프론트엔드 유효성 검사를 위해 import
import { useAuthStore, selectUser, selectIsLoadingAuth } from '../shared/store/authStore';
import BackgroundBlobs from '../widgets/rootlayout/BackgroundBlobs';
import './ProfileSetupPage.css';

const POSITIONS = ['학생', '원장', '강사', '학부모'] as const;
type PositionType = typeof POSITIONS[number];

const profileFormSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  position: z.enum(POSITIONS, { 
    errorMap: () => ({ message: "직급을 선택해주세요." }) 
  }),
  academyName: z.string().min(1, "학원 이름은 필수 항목입니다.").max(150),
  region: z.string().min(1, "지역은 필수 항목입니다.").max(100),
});
type ProfileFormSchema = z.infer<typeof profileFormSchema>;

const ProfileSetupPage: React.FC = () => {
    const navigate = useNavigate();

    const isLoadingAuth = useAuthStore(selectIsLoadingAuth);
    const user = useAuthStore(selectUser);

    const [isCheckingProfile, setIsCheckingProfile] = useState(true); // 프로필 확인 API 로딩 상태
    const [isSubmitting, setIsSubmitting] = useState(false); // 폼 제출 API 로딩 상태
    
    const [name, setName] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<PositionType | ''>('');
    const [academyName, setAcademyName] = useState('');
    const [region, setRegion] = useState('');

    const [formErrors, setFormErrors] = useState<z.ZodFormattedError<ProfileFormSchema> | null>(null);
    const [apiErrorMessage, setApiErrorMessage] = useState('');

    useEffect(() => {
        if (!isLoadingAuth && user) {
            const checkProfile = async () => {
                try {
                    const response = await fetch('/api/profiles/exists');
                    if (!response.ok) throw new Error(`API Error: ${response.status}`);
                    
                    const data = await response.json();

                    if (data.exists) {
                        navigate('/', { replace: true });
                    } else {
                        setName(user.user_metadata?.name || ''); // 이름 기본값 설정
                        setIsCheckingProfile(false);
                    }
                } catch (error) {
                    console.error('Failed to check profile:', error);
                    setApiErrorMessage('프로필 확인 중 오류가 발생했습니다. 새로고침 해주세요.');
                    setIsCheckingProfile(false);
                }
            };
            checkProfile();
        } else if (!isLoadingAuth && !user) {
            navigate('/login', { replace: true });
        }
    }, [isLoadingAuth, user, navigate]);

    const handleSaveProfile = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || isSubmitting) return;
        
        const validationResult = profileFormSchema.safeParse({ name, position: selectedPosition, academyName, region });
        if (!validationResult.success) {
            setFormErrors(validationResult.error.format());
            return;
        }
        
        setFormErrors(null);
        setIsSubmitting(true);
        setApiErrorMessage('');

        try {
            const response = await fetch('/api/profiles/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validationResult.data),
            });
            
            if (response.ok) {
                navigate('/', { replace: true });
            } else {
                const data = await response.json();
                setApiErrorMessage(data.error || '프로필 저장에 실패했습니다.');
            }
        } catch (error) {
            setApiErrorMessage('네트워크 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPageLoading = isLoadingAuth || isCheckingProfile;
    if (isPageLoading) {
        return (
            <div className="profile-setup-page-wrapper">
                <div className="profile-setup-container" style={{ textAlign: 'center' }}>
                    <h1>사용자 정보를 확인하는 중입니다...</h1>
                </div>
            </div>
        );
    }
    
    return (
        <div className="profile-setup-page-wrapper">
            <div className="login-background-blobs-wrapper">
                <BackgroundBlobs />
            </div>
            <div className="profile-setup-container">
                <h1 className="profile-setup-title">프로필 설정</h1>
                <p className="profile-setup-subtitle">서비스 이용을 위해 추가 정보를 입력해 주세요.</p>
                <form onSubmit={handleSaveProfile} className="profile-setup-form" noValidate>
                    <div className="form-group">
                        <label className="form-label">직급</label>
                        <div className="position-buttons-group">
                            {POSITIONS.map((pos) => (
                                <button type="button" key={pos}
                                    className={`position-button ${selectedPosition === pos ? 'active' : ''}`}
                                    onClick={() => setSelectedPosition(pos)}>
                                    {pos}
                                </button>
                            ))}
                        </div>
                        {formErrors?.position && <p className="error-message">{formErrors.position._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="name" className="form-label">이름</label>
                        <input type="text" id="name" value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="이름을 입력하세요" className="form-input" />
                        {formErrors?.name && <p className="error-message">{formErrors.name._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="academyName" className="form-label">학원 이름</label>
                        <input type="text" id="academyName" value={academyName}
                            onChange={(e) => setAcademyName(e.target.value)}
                            placeholder="학원 이름을 입력하세요" className="form-input" />
                        {formErrors?.academyName && <p className="error-message">{formErrors.academyName._errors[0]}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="region" className="form-label">지역</label>
                        <input type="text" id="region" value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            placeholder="예: 서울특별시 강남구" className="form-input" />
                        {formErrors?.region && <p className="error-message">{formErrors.region._errors[0]}</p>}
                    </div>

                    {apiErrorMessage && <p className="error-message api-error">{apiErrorMessage}</p>}
                    
                    <button type="submit" disabled={isSubmitting} className="submit-button">
                        {isSubmitting ? '저장 중...' : '저장하고 시작하기'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetupPage;
----- ./react/pages/StudentDetailPage.tsx -----
import React from 'react';
import { useParams } from 'react-router';

const StudentDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <div style={{ padding: '20px' }}>
            <h1>학생 상세 정보</h1>
            <p>선택된 학생의 ID는 <strong>{id}</strong> 입니다.</p>
            <br />
            <p>이곳에 해당 학생의 모든 정보를 표시하고, 수정/관리하는 UI를 구성할 수 있습니다.</p>
        </div>
    );
};

export default StudentDetailPage;
----- ./react/shared/api/api.utils.ts -----
export async function handleApiResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let errorBody: { message?: string; error?: string; details?: any } = { message: `API Error: ${res.status}` };
        try {
            errorBody = await res.json();
        } catch (e) {
            console.warn("API error response was not valid JSON.", { status: res.status });
        }
        throw new Error(errorBody.message || errorBody.error || `API Error: ${res.status}`);
    }

    if (res.status === 204) {
        return undefined as T; 
    }

    return res.json();
}
----- ./react/shared/components/GlassPopover.tsx -----
import React, { useEffect, useRef, ReactNode } from 'react';
import ReactDOM from 'react-dom';
import './GlassPopover.css'; // Popover 스타일을 위한 CSS 파일

interface GlassPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    anchorEl: HTMLElement | null; // Popover가 기준으로 할 HTML 요소
    children: ReactNode; // Popover 내부에 표시될 콘텐츠
    placement?: 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start'; // 위치 (간단하게 몇 가지만)
    offsetY?: number; // 세로 간격
    offsetX?: number; // 가로 간격
}

const GlassPopover: React.FC<GlassPopoverProps> = ({
    isOpen,
    onClose,
    anchorEl,
    children,
    placement = 'bottom-end',
    offsetY = 8,
    offsetX = 0,
}) => {
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                anchorEl && // 앵커 요소가 있고
                !anchorEl.contains(event.target as Node) // 앵커 요소 클릭이 아닌 경우
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, anchorEl]);

    const getPopoverStyle = (): React.CSSProperties => {
        if (!anchorEl || !popoverRef.current) {
            return { visibility: 'hidden', opacity: 0 };
        }

        const anchorRect = anchorEl.getBoundingClientRect();
        const popoverRect = popoverRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (placement) {
            case 'bottom-end':
                top = anchorRect.bottom + offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
                break;
            case 'bottom-start':
                top = anchorRect.bottom + offsetY;
                left = anchorRect.left + offsetX;
                break;
            case 'top-end':
                top = anchorRect.top - popoverRect.height - offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
                break;
            case 'top-start':
                top = anchorRect.top - popoverRect.height - offsetY;
                left = anchorRect.left + offsetX;
                break;
            default: // bottom-end as default
                top = anchorRect.bottom + offsetY;
                left = anchorRect.right - popoverRect.width + offsetX;
        }

        if (left + popoverRect.width > window.innerWidth - 10) { // 오른쪽 경계
            left = window.innerWidth - popoverRect.width - 10;
        }
        if (left < 10) { // 왼쪽 경계
            left = 10;
        }
        if (top + popoverRect.height > window.innerHeight - 10) { // 아래쪽 경계
            top = anchorRect.top - popoverRect.height - offsetY; // 위로 변경
        }
        if (top < 10) { // 위쪽 경계
            top = 10;
        }


        return {
            position: 'fixed', // fixed 포지션 사용
            top: `${top}px`,
            left: `${left}px`,
            visibility: isOpen ? 'visible' : 'hidden',
            opacity: isOpen ? 1 : 0,
        };
    };

    if (typeof document === 'undefined') {
        return null; // SSR 환경에서는 렌더링하지 않음
    }

    return ReactDOM.createPortal(
        <div
            ref={popoverRef}
            className={`glass-popover ${isOpen ? 'open' : ''}`}
            style={getPopoverStyle()}
            role="dialog" // 접근성을 위해 역할 명시
            aria-modal="false" // 모달이 아님을 명시
            aria-hidden={!isOpen}
        >
            {children}
        </div>,
        document.body
    );
};

export default GlassPopover;
----- ./react/shared/hooks/useColumnPermissions.ts -----
import { useMemo } from 'react';

export const COLUMN_CONFIG = [
  { key: 'grade', label: '학년' },
  { key: 'subject', label: '과목' },
  { key: 'status', label: '상태' },
  { key: 'teacher', label: '담당 강사' },
  { key: 'student_phone', label: '학생 연락처' },
  { key: 'guardian_phone', label: '학부모 연락처' },
  { key: 'school_name', label: '학교명' },
  { key: 'tuition', label: '수강료' },
  { key: 'admission_date', label: '입원일' },
  { key: 'discharge_date', label: '퇴원일' },
] as const; // as const로 key 값을 string이 아닌 리터럴 타입으로 추론

const ROLE_PERMISSIONS = {
  '원장': COLUMN_CONFIG.map(c => c.key),
  '강사': [
    'grade', 'subject', 'status', 'teacher', 'student_phone',
    'school_name', 'admission_date', 'discharge_date'
  ],
} as const;

type Role = keyof typeof ROLE_PERMISSIONS;

export function useColumnPermissions() {
  const currentUserRole: Role = '원장'; // 지금은 '원장'으로 하드코딩, '강사'로 바꿔서 테스트해보세요.

  const permittedColumnKeys = useMemo(() => {
    return ROLE_PERMISSIONS[currentUserRole] || [];
  }, [currentUserRole]);

  const permittedColumnsConfig = useMemo(() => {
    return COLUMN_CONFIG.filter(col => permittedColumnKeys.includes(col.key));
  }, [permittedColumnKeys]);

  return { 
    permittedColumnKeys,      // 허용된 컬럼 키 배열
    permittedColumnsConfig,   // 허용된 컬럼의 설정 객체 배열 (UI용)
    allColumnConfig: COLUMN_CONFIG, // 테이블 정의에 필요한 전체 설정
  };
}
----- ./react/shared/hooks/useDragToScroll.ts -----
import { useRef, useState, useCallback, useEffect } from 'react';

export function useDragToScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [isDragging, setIsDragging] = useState(false);
    const isDraggingRef = useRef(false);

    const dragStartInfo = useRef({
        startX: 0,
        scrollLeft: 0,
    });

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!(e.target instanceof HTMLElement)) return;

        if (e.target.closest('button, a, input, [role="button"], [role="checkbox"]')) {
            return;
        }

        if (!ref.current || e.button !== 0) return;
        
        e.preventDefault(); 

        isDraggingRef.current = true;
        setIsDragging(true);

        dragStartInfo.current = {
            startX: e.pageX - ref.current.offsetLeft,
            scrollLeft: ref.current.scrollLeft,
        };
    }, []);

    const handleMouseUp = useCallback(() => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        setIsDragging(false);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDraggingRef.current || !ref.current) return;
        e.preventDefault();

        const x = e.pageX - ref.current.offsetLeft;
        const walk = (x - dragStartInfo.current.startX);
        ref.current.scrollLeft = dragStartInfo.current.scrollLeft - walk;
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseleave', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return { ref, onMouseDown: handleMouseDown, isDragging };
}
----- ./react/shared/hooks/useVisibleColumns.ts -----
import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';
import { useColumnPermissions, COLUMN_CONFIG } from './useColumnPermissions';

/**
 * 권한과 사용자 설정을 조합하여
 * 각 컬럼의 최종 표시 여부를 결정하는 훅
 */
export function useVisibleColumns() {
  const { permittedColumnKeys } = useColumnPermissions();
  const { columnVisibility: userPreferences } = useUIStore();

  const finalVisibility = useMemo(() => {
    const visibilityMap: Record<string, boolean> = {};

    COLUMN_CONFIG.forEach(col => {
      const { key } = col;
      const hasPermission = permittedColumnKeys.includes(key);
      const userPrefersVisible = userPreferences[key] ?? true;
      visibilityMap[key] = hasPermission && userPrefersVisible;
    });

    visibilityMap['header_action_button'] = true;
    visibilityMap['student_name'] = true;
    visibilityMap['actions'] = true;

    return visibilityMap;

  }, [permittedColumnKeys, userPreferences]);

  return finalVisibility;
}
----- ./react/shared/lib/AuthInitializer.tsx -----

import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthInitializer: React.FC = () => {
  const initializeAuth = useAuthStore.getState().initializeAuthListener;

  useEffect(() => {
    initializeAuth();

    
  }, [initializeAuth]); // 의존성 배열은 안정성을 위해 유지합니다.

  return null; 
};

export default AuthInitializer;
----- ./react/shared/lib/axiosInstance.ts -----
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8787'; // 환경 변수로 설정 가능, 예: process.env.REACT_APP_API_BASE_URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 요청 타임아웃 10초
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Supabase 쿠키 인증을 위해 필요할 수 있음 (CORS 설정과 함께 확인)
});


axiosInstance.interceptors.response.use(
  (response) => {
    return response; // 성공적인 응답은 그대로 반환
  },
  (error) => {
    if (error.response && error.response.status === 401) {
    }
    return Promise.reject(error); // 에러를 계속 전파하여 React Query가 처리하도록 함
  }
);

export default axiosInstance;
----- ./react/shared/lib/ProtectedRoute.tsx -----
import { Navigate, Outlet } from 'react-router';
import { useAuthStore, selectIsAuthenticated } from '../store/authStore'; // authStore 경로 확인

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
----- ./react/shared/lib/supabase.ts -----
import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
----- ./react/shared/store/authStore.ts -----
import { create } from 'zustand';
import { supabase } from '../lib/supabase'; // 실제 Supabase 클라이언트 인스턴스 경로로 수정해주세요.
import type { User as SupabaseUser, Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

export type User = SupabaseUser;

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoadingAuth: boolean; // 초기 인증 상태 확인 및 실시간 변경 시 로딩 상태
  authSubscription: Subscription | null; // onAuthStateChange 구독 객체 (클린업용)
  authError: string | null; // 인증 관련 에러 메시지 (선택적)
}

interface AuthActions {
  initializeAuthListener: () => Promise<void>; // 앱 시작 시 인증 리스너 초기화
  clearAuthSubscription: () => void; // 구독 해제
  signInWithKakao: () => Promise<void>; // 카카오 OAuth 로그인
  signOut: () => Promise<void>; // 로그아웃
  clearAuthError: () => void; // 인증 에러 메시지 초기화 (선택적)
}

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  user: null,
  session: null,
  isLoadingAuth: true, // 앱 시작 시 인증 상태를 확인해야 하므로 true로 시작
  authSubscription: null,
  authError: null,

  initializeAuthListener: async () => {
    if (get().authSubscription || !get().isLoadingAuth) {
      if (get().authSubscription) return;
    }
    set({ isLoadingAuth: true, authError: null }); // 리스너 초기화 시작 시 로딩 및 에러 초기화

    try {
      const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession();

      if (initialError) {
        console.error('Error getting initial session for authStore:', initialError.message);
        set({ user: null, session: null, isLoadingAuth: false, authError: initialError.message });
      } else {
        set({
          user: initialSession?.user ?? null,
          session: initialSession,
          isLoadingAuth: false,
          authError: null,
        });
      }
    } catch (e: any) {
      console.error('Exception during initial session fetch for authStore:', e);
      set({ user: null, session: null, isLoadingAuth: false, authError: e.message || 'Unknown error during initial session fetch.' });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        set({
          user: session?.user ?? null,
          session,
          isLoadingAuth: false, // 실시간 변경이므로 로딩 완료 상태
          authError: null,      // 이벤트 발생 시 이전 에러는 클리어
        });

      }
    );

    set({ authSubscription: subscription, isLoadingAuth: false }); // 리스너 설정 완료 시 로딩 종료
  },

  clearAuthSubscription: () => {
    const subscription = get().authSubscription;
    if (subscription) {
      subscription.unsubscribe();
      set({ authSubscription: null });
    }
  },

  signInWithKakao: async () => {
    set({ isLoadingAuth: true, authError: null }); // OAuth 시작 시 로딩 및 에러 초기화
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/profilesetup`,
        },
      });
      if (error) {
        console.error('Kakao OAuth error in authStore:', error.message);
        set({ isLoadingAuth: false, authError: error.message });
      }
    } catch (e: any) {
      console.error('Exception during Kakao sign in:', e);
      set({ isLoadingAuth: false, authError: e.message || 'Unknown error during Kakao sign in.' });
    }
  },

  signOut: async () => {
    set({ isLoadingAuth: true, authError: null }); // 로그아웃 시작 시 로딩 및 에러 초기화
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out in authStore:', error.message);
        set({ isLoadingAuth: false, authError: error.message });
      } else {
        set({ user: null, session: null, isLoadingAuth: false, authError: null });
      }
    } catch (e: any) {
      console.error('Exception during sign out:', e);
      set({ user: null, session: null, isLoadingAuth: false, authError: e.message || 'Unknown error during sign out.' });
    }
  },

  clearAuthError: () => {
    set({ authError: null });
  },
}));

/**
 * 사용자가 인증되었고, 인증 상태 로딩이 완료되었는지 여부를 반환합니다.
 */
export const selectIsAuthenticated = (state: AuthState): boolean => !state.isLoadingAuth && !!state.user;

/**
 * 단순히 사용자 객체의 존재 여부로 인증 상태를 판단합니다. (로딩 상태 미고려)
 */
export const selectUserExists = (state: AuthState): boolean => !!state.user;

/**
 * 현재 인증 관련 작업(초기 세션 확인, 상태 변경)이 로딩 중인지 여부를 반환합니다.
 */
export const selectIsLoadingAuth = (state: AuthState): boolean => state.isLoadingAuth;

/**
 * 현재 사용자 객체를 반환합니다. 인증되지 않았거나 로딩 중이면 null일 수 있습니다.
 */
export const selectUser = (state: AuthState): User | null => state.user;

/**
 * 현재 세션 객체를 반환합니다. 인증되지 않았거나 로딩 중이면 null일 수 있습니다.
 */
export const selectSession = (state: AuthState): Session | null => state.session;

/**
 * 현재 인증 관련 에러 메시지를 반환합니다. 에러가 없으면 null입니다.
 */
export const selectAuthError = (state: AuthState): string | null => state.authError;
----- ./react/shared/store/layoutStore.ts -----
import { create } from 'zustand';
import type { ReactNode } from 'react';

interface StoredSearchProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    activeFilters: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    suggestionGroups: string;
    onToggleFiltered: () => void;
    onCreateProblemSet: () => void;
    selectedCount: number;
}

interface SidebarTriggers {
  onRegisterClick?: () => void;
  onSettingsClick?: () => void;
  onClose?: () => void;
}

interface LayoutState {
  rightSidebarContent: ReactNode | null;
  sidebarTriggers: SidebarTriggers;
  studentSearchProps: StoredSearchProps | null;
}

interface LayoutActions {
  setRightSidebarContent: (content: ReactNode | null) => void;
  setSidebarTriggers: (triggers: SidebarTriggers) => void;
  setStudentSearchProps: (props: StoredSearchProps | null) => void;
}

export const useLayoutStore = create<LayoutState & LayoutActions>((set) => ({
  rightSidebarContent: null,
  sidebarTriggers: {},
  studentSearchProps: null,
  
  setRightSidebarContent: (content) => set({ rightSidebarContent: content }),
  setSidebarTriggers: (triggers) => set({ sidebarTriggers: triggers }),
  setStudentSearchProps: (props) => set({ studentSearchProps: props }),
}));

export const selectRightSidebarContent = (state: LayoutState) => state.rightSidebarContent;
export const selectStudentSearchProps = (state: LayoutState) => state.studentSearchProps;
export const selectSidebarTriggers = (state: LayoutState) => state.sidebarTriggers;
----- ./react/shared/store/uiStore.ts -----
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const breakpoints = {
    mobile: 768,
    tablet: 1024,
};

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const allStudentTableColumns: string[] = [
    'grade', 'subject', 'status', 'teacher', 'student_phone', 
    'guardian_phone', 'school_name', 'tuition', 'admission_date', 'discharge_date'
];

const initialColumnVisibility = allStudentTableColumns.reduce((acc, key) => {
    acc[key] = true;
    return acc;
}, {} as Record<string, boolean>);


const getCurrentBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width <= breakpoints.mobile) return 'mobile';
    if (width <= breakpoints.tablet) return 'tablet';
    return 'desktop';
};

export interface UIState {
    isRightSidebarExpanded: boolean;
    toggleRightSidebar: () => void;
    setRightSidebarExpanded: (expanded: boolean) => void;
    isLeftSidebarExpanded: boolean;
    toggleLeftSidebar: () => void;
    setLeftSidebarExpanded: (expanded: boolean) => void;
    mobileSidebarType: 'left' | 'right' | null;
    openMobileSidebar: (type: 'left' | 'right') => void;
    closeMobileSidebar: () => void;
    currentBreakpoint: Breakpoint;
    updateBreakpoint: () => void;
    columnVisibility: Record<string, boolean>;
    toggleColumnVisibility: (key: string) => void;
}

const log = (action: string, payload?: any) => {
    console.log(`[UIStore] Action: ${action}`, payload !== undefined ? { payload } : '');
};


export const useUIStore = create(
    subscribeWithSelector<UIState>((set, get) => ({
        isRightSidebarExpanded: false,
        toggleRightSidebar: () => {
            log('toggleRightSidebar');
            const currentBp = get().currentBreakpoint;
            if (currentBp === 'mobile') {
                if (get().mobileSidebarType === 'right') {
                    get().closeMobileSidebar();
                } else {
                    get().openMobileSidebar('right');
                }
            } else {
                set((state) => ({ isRightSidebarExpanded: !state.isRightSidebarExpanded }));
            }
        },
        setRightSidebarExpanded: (expanded: boolean) => {
            log('setRightSidebarExpanded', expanded);
            const { currentBreakpoint, openMobileSidebar, closeMobileSidebar } = get();
            if (currentBreakpoint === 'mobile') {
                if (expanded) {
                    openMobileSidebar('right');
                } else {
                    closeMobileSidebar();
                }
            } else {
                set({ isRightSidebarExpanded: expanded });
            }
        },

        isLeftSidebarExpanded: true,
        toggleLeftSidebar: () => {
            log('toggleLeftSidebar');
            const currentBp = get().currentBreakpoint;
            if (currentBp === 'mobile') {
                if (get().mobileSidebarType === 'left') {
                    get().closeMobileSidebar();
                } else {
                    get().openMobileSidebar('left');
                }
            } else {
                set((state) => ({ isLeftSidebarExpanded: !state.isLeftSidebarExpanded }));
            }
        },
        setLeftSidebarExpanded: (expanded) => {
            log('setLeftSidebarExpanded', expanded);
            set({ isLeftSidebarExpanded: expanded });
        },

        mobileSidebarType: null,
        openMobileSidebar: (type) => {
            log('openMobileSidebar', type);
            set({ mobileSidebarType: type });
        },
        closeMobileSidebar: () => {
            if (get().mobileSidebarType !== null) {
                log('closeMobileSidebar');
                set({ mobileSidebarType: null });
            }
        },
        
        currentBreakpoint: getCurrentBreakpoint(),
        updateBreakpoint: () => {
            const newBreakpoint = getCurrentBreakpoint();
            const oldBreakpoint = get().currentBreakpoint;
            if (newBreakpoint !== oldBreakpoint) {
                log('updateBreakpoint', { from: oldBreakpoint, to: newBreakpoint });
                set({ currentBreakpoint: newBreakpoint });
                get().closeMobileSidebar();

                if (newBreakpoint === 'desktop') {
                    get().setLeftSidebarExpanded(true);
                } else if (newBreakpoint === 'tablet') {
                    get().setLeftSidebarExpanded(false);
                }
            }
        },

        columnVisibility: initialColumnVisibility,
        toggleColumnVisibility: (key: string) => {
            log('toggleColumnVisibility', key);
            set((state) => ({
                columnVisibility: {
                    ...state.columnVisibility,
                    [key]: !state.columnVisibility[key],
                }
            }));
        },
    }))
);

if (typeof window !== 'undefined') {
    const { updateBreakpoint, setLeftSidebarExpanded, currentBreakpoint } = useUIStore.getState();

    window.addEventListener('resize', updateBreakpoint);

    const initialBp = currentBreakpoint;
    if (initialBp === 'desktop') {
        setLeftSidebarExpanded(true);
    } else {
        setLeftSidebarExpanded(false);
    }
    useUIStore.getState().updateBreakpoint();
}
----- ./react/shared/ui/actionbutton/ActionButton.tsx -----
import React from 'react';
import './ActionButton.css';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    'aria-label': string; // 아이콘 버튼의 접근성을 위해 필수 항목으로 지정
}

const ActionButton: React.FC<ActionButtonProps> = ({ 
    children, 
    className, 
    ...props 
}) => {
    const combinedClassName = `action-button ${className || ''}`.trim();

    return (
        <button className={combinedClassName} {...props}>
            {children}
        </button>
    );
};

export default ActionButton;
----- ./react/shared/ui/Badge/Badge.tsx -----
import React from 'react';
import './Badge.css'; // Badge의 기본 구조/레이아웃 CSS

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ children, className = '', ...props }) => {
    return (
        <span className={`badge ${className}`} {...props}>
            {children}
        </span>
    );
};

export default Badge;
----- ./react/shared/ui/codemirror-editor/codemirror-setup/auto-complete/auto-completions.ts -----
import {
  blockDelimiters,
  inlineDelimiters,
  blockLatexOperators,
  inlineTextLatexCommands,
  blockTextLatexCommands,
  inlineMathLatexCommands,
} from "./dictionary";

import { AutoCompleteMode } from "./dictionary";

export { AutoCompleteMode, AutoCompleteEnv } from "./dictionary";

const autoCompletions = {
  delimiters: {
    [AutoCompleteMode.BLOCK]: blockDelimiters,
    [AutoCompleteMode.INLINE]: inlineDelimiters,
  },

  latexOperators: {
    [AutoCompleteMode.BLOCK]: blockLatexOperators,
  },

  /** LaTeX commands in Text mode/environment */
  textLatexCommands: {
    [AutoCompleteMode.BLOCK]: blockTextLatexCommands,
    [AutoCompleteMode.INLINE]: inlineTextLatexCommands,
  },

  /** LaTeX commands in Math mode/environment */
  mathLatexCommands: {
    [AutoCompleteMode.INLINE]: inlineMathLatexCommands,
  },
};
export default autoCompletions;
----- ./react/shared/ui/codemirror-editor/codemirror-setup/auto-complete/configure.ts -----
import { CompletionContext, snippet } from "@codemirror/autocomplete";
import { markdownLanguage } from "../markdown-parser/markdown";
import { TEX_LANGUAGE } from "../markdown-parser/consts";
import autoCompletions, { AutoCompleteMode } from "./auto-completions";
import { type Extension } from "@codemirror/state";

const isAtInlineMath = (line: string, cur: number) => {
  const ahead = line.substring(0, cur);
  const openTagExists = ahead.lastIndexOf("\\)") < ahead.lastIndexOf("\\(");
  
  const closeTagBehind = line.indexOf("\\)", cur);
  const openTagBehind = line.indexOf("\\(", cur);
  const closeTagExists = (closeTagBehind === -1 ? Infinity : closeTagBehind) < 
    (openTagBehind === -1 ? Infinity : openTagBehind);
  
  return openTagExists && closeTagExists;
};

const configureMmdAutoCompleteForCodeMirror = (extensions: Extension[]) => {
  const mmdACSource = (context: CompletionContext) => {
    const word = context.matchBefore(/(\\[\w\[\{\(\*]*)/);
    if (!word || (word.from === word.to && !context.explicit)) {
      return null;
    }
    const atLineStart: boolean = Boolean(context.matchBefore(/^(\\[\w\[\{\(\*]*)/));
    const line = context.state.doc.lineAt(context.pos);
    const cur = context.pos - line.from;
    const atInlineMath = isAtInlineMath(line.text, cur);

    const options: unknown[] = [];
    atLineStart && autoCompletions.delimiters[AutoCompleteMode.BLOCK].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 80 + item.rank });
    });
    atInlineMath || autoCompletions.delimiters[AutoCompleteMode.INLINE].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 80 });
    });
    atLineStart && autoCompletions.latexOperators[AutoCompleteMode.BLOCK].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 70 });
    });
    atLineStart && autoCompletions.textLatexCommands[AutoCompleteMode.BLOCK].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 60 });
    });
    atInlineMath || autoCompletions.textLatexCommands[AutoCompleteMode.INLINE].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 50 });
    });
    atInlineMath && autoCompletions.mathLatexCommands[AutoCompleteMode.INLINE].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template) });
    });
    return {
      from: word.from,
      options
    };
  };

  const latexACSource = (context: CompletionContext) => {
    let word = context.matchBefore(/(\\[\w\{]*)/);
    if (!word || (word.from === word.to && !context.explicit)) {
      return null;
    }
    const endOfDoubleBackslash = context.matchBefore(/(\\\\)/);
    if (endOfDoubleBackslash) {
      return null;
    }
    const atLineStart: boolean = Boolean(context.matchBefore(/^(\\[\w\{]*)/));

    const options: unknown[] = [];
    atLineStart && autoCompletions.latexOperators[AutoCompleteMode.BLOCK].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template), boost: 10 });
    });
    autoCompletions.mathLatexCommands[AutoCompleteMode.INLINE].forEach(item => {
      options.push({ label: item.label, apply: snippet(item.template) });
    });
    return {
      from: word.from,
      options
    };
  };

  extensions.push(markdownLanguage.data.of({
    autocomplete: mmdACSource,
    closeBrackets: { brackets: ["'", '"'] }
  }));
  extensions.push(TEX_LANGUAGE.data.of({
    autocomplete: latexACSource
  }));
};

export default configureMmdAutoCompleteForCodeMirror
----- ./react/shared/ui/codemirror-editor/codemirror-setup/auto-complete/dictionary.ts -----
export enum AutoCompleteMode {
  BLOCK = 'block',
  INLINE = 'inline'  
};

export enum AutoCompleteEnv {
  MATH = 'math',
  TEXT = 'text'
};

export const blockDelimiters = [
  {
    label: "\\[...\\]",
    template: "\\[\n${}\n\\]",
    mode: AutoCompleteMode.BLOCK,
    rank: 9
  },
  {
    label: "\\begin{equation}...\\end{equation}",
    template: "\\begin{equation}\n${}\n\\end{equation}",
    mode: AutoCompleteMode.BLOCK,
    rank: 8
  },
  {
    label: "\\begin{equation*}...\\end{equation*}",
    template: "\\begin{equation*}\n${}\n\\end{equation*}",
    mode: AutoCompleteMode.BLOCK,
    rank: 7
  }
];

export const inlineDelimiters = [
  {
    label: "\\(...\\)",
    template: "\\(${}\\)",
    mode: AutoCompleteMode.INLINE
  }
];

export const blockLatexOperators = [
  {
    label: "\\begin{tabular}...\\end{tabular}",
    template: "\\begin{tabular}{${}}\n${}\n\\end{tabular}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{array}{}...\\end{array}",
    template: "\\begin{array}{${}}\n${}\n\\end{array}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{subarray}...\\end{subarray}",
    template: "\\begin{subarray}\n${}\n\\end{subarray}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{align}...\\end{align}",
    template: "\\begin{align}\n${}\n\\end{align}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{align*}...\\end{align*}",
    template: "\\begin{align*}\n${}\n\\end{align*}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{split}...\\end{split}",
    template: "\\begin{split}\n${}\n\\end{split}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{gather}...\\end{gather}",
    template: "\\begin{gather}\n${}\n\\end{gather}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{gather*}...\\end{gather*}",
    template: "\\begin{gather*}\n${}\n\\end{gather*}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{itemize}...\\end{itemize}",
    template: "\\begin{itemize}\n\\item ${}\n\\item ${}\n\\end{itemize}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{figure}[h]...\\end{figure}",
    template: "\\begin{figure}[h]\n\\includegraphics[width=0.5\\textwidth, center]{${URL}}\n\\end{figure}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{enumerate}...\\end{enumerate}",
    template: "\\begin{enumerate}\n\\item ${}\n\\end{enumerate}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{aligned}...\\end{aligned}",
    template: "\\begin{aligned}\n${}\n\\end{aligned}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{matrix}...\\end{matrix}",
    template: "\\begin{matrix}\n${}\n\\end{matrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{pmatrix}...\\end{pmatrix}",
    template: "\\begin{pmatrix}\n${}\n\\end{pmatrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{bmatrix}...\\end{bmatrix}",
    template: "\\begin{bmatrix}\n${}\n\\end{bmatrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{Bmatrix}...\\end{Bmatrix}",
    template: "\\begin{Bmatrix}\n${}\n\\end{Bmatrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{vmatrix}...\\end{vmatrix}",
    template: "\\begin{vmatrix}\n${}\n\\end{vmatrix}",
    mode: AutoCompleteMode.BLOCK
  },
  {
    label: "\\begin{Vmatrix}...\\end{Vmatrix}",
    template: "\\begin{Vmatrix}\n${}\n\\end{Vmatrix}",
    mode: AutoCompleteMode.BLOCK
  }
];

export const blockTextLatexCommands = [
  {
    label: "\\section{...}",
    template: "\\section{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\subsection{...}",
    template: "\\subsection{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\subsubsection{...}",
    template: "\\subsubsection{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\title{...}",
    template: "\\title{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\author{...}",
    template: "\\author{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{abstract}...\\end{abstract}",
    template: "\\begin{abstract}\n${}\n\\end{abstract}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{theorem}...\\end{theorem}",
    template: "\\begin{theorem}\n${}\n\\end{theorem}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{lemma}...\\end{lemma}",
    template: "\\begin{lemma}\n${}\n\\end{lemma}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{proof}...\\end{proof}",
    template: "\\begin{proof}\n${}\n\\end{proof}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\begin{corollary}...\\end{corollary}",
    template: "\\begin{corollary}\n${}\n\\end{corollary}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  }
];

export const inlineTextLatexCommands = [
  {
    label: "\\pagebreak",
    template: "\\pagebreak",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\eqref{...}",
    template: "\\eqref{${}}",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.TEXT
  },  
  {
    label: "\\ref{...}",
    template: "\\ref{${}}",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\newtheorem{...}{...}",
    template: "\\newtheorem{${}}{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\newtheorem*{...}{...}",
    template: "\\newtheorem*{${}}{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\setcounter{...}{...}",
    template: "\\setcounter{${}}{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\theoremstyle{...}",
    template: "\\theoremstyle{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\footnote{...}",
    template: "\\footnote{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\footnotetext{...}",
    template: "\\footnotetext{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\footnotemark{}",
    template: "\\footnotemark{}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\textit{...}",
    template: "\\textit{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\textbf{...}",
    template: "\\textbf{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\texttt{...}",
    template: "\\texttt{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },  
  {
    label: "\\text{...}",
    template: "\\text{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\underline{...}",
    template: "\\underline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\uline{...}",
    template: "\\uline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\uuline{...}",
    template: "\\uuline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\uwave{...}",
    template: "\\uwave{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\dashuline{...}",
    template: "\\dashuline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\dotuline{...}",
    template: "\\dotuline{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\sout{...}",
    template: "\\sout{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  },
  {
    label: "\\xout{...}",
    template: "\\xout{${}}",
    mode: AutoCompleteMode.BLOCK,
    env: AutoCompleteEnv.TEXT
  }
];

export const inlineMathLatexCommands = [
  {
    label: "\\AA",
    template: "\\AA",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\aleph",
    template: "\\aleph",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\alpha",
    template: "\\alpha",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\angle",
    template: "\\angle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\approx",
    template: "\\approx",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\asymp",
    template: "\\asymp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\atop",
    template: "\\atop",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\backslash",
    template: "\\backslash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\because",
    template: "\\because",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\beta",
    template: "\\beta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\beth",
    template: "\\beth",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigcap",
    template: "\\bigcap",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigcirc",
    template: "\\bigcirc",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigcup",
    template: "\\bigcup",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigoplus",
    template: "\\bigoplus",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigotimes",
    template: "\\bigotimes",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigvee",
    template: "\\bigvee",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bigwedge",
    template: "\\bigwedge",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\boldsymbol",
    template: "\\boldsymbol",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bot",
    template: "\\bot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bowtie",
    template: "\\bowtie",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\breve",
    template: "\\breve",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\bullet",
    template: "\\bullet",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cap",
    template: "\\cap",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cdot",
    template: "\\cdot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cdots",
    template: "\\cdots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\check",
    template: "\\check",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\chi",
    template: "\\chi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\circ",
    template: "\\circ",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\circlearrowleft",
    template: "\\circlearrowleft",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\circlearrowright",
    template: "\\circlearrowright",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cline",
    template: "\\cline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\complement",
    template: "\\complement",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cong",
    template: "\\cong",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\coprod",
    template: "\\coprod",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\cup",
    template: "\\cup",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\curlyvee",
    template: "\\curlyvee",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\curlywedge",
    template: "\\curlywedge",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\dagger",
    template: "\\dagger",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\dashv",
    template: "\\dashv",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ddot",
    template: "\\ddot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ddots",
    template: "\\ddots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Delta",
    template: "\\Delta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\delta",
    template: "\\delta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\diamond",
    template: "\\diamond",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\div",
    template: "\\div",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\dot",
    template: "\\dot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\doteq",
    template: "\\doteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\dots",
    template: "\\dots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\downarrow",
    template: "\\downarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ell",
    template: "\\ell",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\emptyset",
    template: "\\emptyset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\epsilon",
    template: "\\epsilon",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\equiv",
    template: "\\equiv",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\eta",
    template: "\\eta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\exists",
    template: "\\exists",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\forall",
    template: "\\forall",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\frac",
    template: "\\frac",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\frown",
    template: "\\frown",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Gamma",
    template: "\\Gamma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\gamma",
    template: "\\gamma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\geq",
    template: "\\geq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\geqq",
    template: "\\geqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\geqslant",
    template: "\\geqslant",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\gg",
    template: "\\gg",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ggg",
    template: "\\ggg",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\gtrsim",
    template: "\\gtrsim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hat",
    template: "\\hat",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hbar",
    template: "\\hbar",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hline",
    template: "\\hline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hookleftarrow",
    template: "\\hookleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\hookrightarrow",
    template: "\\hookrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Im",
    template: "\\Im",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\imath",
    template: "\\imath",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\in",
    template: "\\in",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\infty",
    template: "\\infty",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\int",
    template: "\\int",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\iota",
    template: "\\iota",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\jmath",
    template: "\\jmath",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\kappa",
    template: "\\kappa",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Lambda",
    template: "\\Lambda",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lambda",
    template: "\\lambda",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\langle",
    template: "\\langle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lceil",
    template: "\\lceil",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ldots",
    template: "\\ldots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leadsto",
    template: "\\leadsto",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Leftarrow",
    template: "\\Leftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftarrow",
    template: "\\leftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftleftarrows",
    template: "\\leftleftarrows",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Leftrightarrow",
    template: "\\Leftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftrightarrow",
    template: "\\leftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftrightarrows",
    template: "\\leftrightarrows",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leftrightharpoons",
    template: "\\leftrightharpoons",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leq",
    template: "\\leq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leqq",
    template: "\\leqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\leqslant",
    template: "\\leqslant",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lessdot",
    template: "\\lessdot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lesseqgtr",
    template: "\\lesseqgtr",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lessgtr",
    template: "\\lessgtr",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lesssim",
    template: "\\lesssim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lfloor",
    template: "\\lfloor",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ll",
    template: "\\ll",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\llbracket",
    template: "\\llbracket",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\llcorner",
    template: "\\llcorner",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lll",
    template: "\\lll",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longdiv",
    template: "\\longdiv",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longleftarrow",
    template: "\\longleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Longleftarrow",
    template: "\\Longleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longleftrightarrow",
    template: "\\longleftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Longleftrightarrow",
    template: "\\Longleftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longmapsto",
    template: "\\longmapsto",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\longrightarrow",
    template: "\\longrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Longrightarrow",
    template: "\\Longrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\lrcorner",
    template: "\\lrcorner",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ltimes",
    template: "\\ltimes",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mapsto",
    template: "\\mapsto",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathbb",
    template: "\\mathbb",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathbf",
    template: "\\mathbf",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathcal",
    template: "\\mathcal",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathfrak",
    template: "\\mathfrak",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathrm",
    template: "\\mathrm",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mathscr",
    template: "\\mathscr",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mho",
    template: "\\mho",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\models",
    template: "\\models",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mp",
    template: "\\mp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\mu",
    template: "\\mu",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\multicolumn",
    template: "\\multicolumn",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\multimap",
    template: "\\multimap",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\multirow",
    template: "\\multirow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nabla",
    template: "\\nabla",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\natural",
    template: "\\natural",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nearrow",
    template: "\\nearrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\neg",
    template: "\\neg",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\neq",
    template: "\\neq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\newline",
    template: "\\newline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nexists",
    template: "\\nexists",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ngtr",
    template: "\\ngtr",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ni",
    template: "\\ni",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nleftarrow",
    template: "\\nleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nLeftarrow",
    template: "\\nLeftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nless",
    template: "\\nless",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nmid",
    template: "\\nmid",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\not",
    template: "\\not",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\notin",
    template: "\\notin",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nprec",
    template: "\\nprec",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\npreceq",
    template: "\\npreceq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nrightarrow",
    template: "\\nrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nRightarrow",
    template: "\\nRightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsim",
    template: "\\nsim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsubseteq",
    template: "\\nsubseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsucc",
    template: "\\nsucc",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsucceq",
    template: "\\nsucceq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nsupseteq",
    template: "\\nsupseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nu",
    template: "\\nu",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nVdash",
    template: "\\nVdash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nvdash",
    template: "\\nvdash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\nwarrow",
    template: "\\nwarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\odot",
    template: "\\odot",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oiiint",
    template: "\\oiiint",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oiint",
    template: "\\oiint",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oint",
    template: "\\oint",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\omega",
    template: "\\omega",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Omega",
    template: "\\Omega",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ominus",
    template: "\\ominus",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\operatorname",
    template: "\\operatorname",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oplus",
    template: "\\oplus",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\oslash",
    template: "\\oslash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\otimes",
    template: "\\otimes",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overbrace",
    template: "\\overbrace",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overleftarrow",
    template: "\\overleftarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overleftrightarrow",
    template: "\\overleftrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overline",
    template: "\\overline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\overparen",
    template: "\\overparen",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\parallel",
    template: "\\parallel",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\partial",
    template: "\\partial",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\perp",
    template: "\\perp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Perp",
    template: "\\Perp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\phi",
    template: "\\phi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Phi",
    template: "\\Phi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\pi",
    template: "\\pi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Pi",
    template: "\\Pi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\pitchfork",
    template: "\\pitchfork",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\pm",
    template: "\\pm",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\prec",
    template: "\\prec",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\preccurlyeq",
    template: "\\preccurlyeq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\preceq",
    template: "\\preceq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\precsim",
    template: "\\precsim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\prime",
    template: "\\prime",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\prod",
    template: "\\prod",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\propto",
    template: "\\propto",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\psi",
    template: "\\psi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Psi",
    template: "\\Psi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\qquad",
    template: "\\qquad",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\quad",
    template: "\\quad",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rangle",
    template: "\\rangle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rceil",
    template: "\\rceil",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Re",
    template: "\\Re",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rfloor",
    template: "\\rfloor",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rho",
    template: "\\rho",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightarrow",
    template: "\\rightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Rightarrow",
    template: "\\Rightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Rightarrow",
    template: "\\Rightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightleftarrows",
    template: "\\rightleftarrows",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightleftharpoons",
    template: "\\rightleftharpoons",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightrightarrows",
    template: "\\rightrightarrows",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rightsquigarrow",
    template: "\\rightsquigarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\risingdotseq",
    template: "\\risingdotseq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rrbracket",
    template: "\\rrbracket",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\rtimes",
    template: "\\rtimes",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\S",
    template: "\\S",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\searrow",
    template: "\\searrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sharp",
    template: "\\sharp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sigma",
    template: "\\sigma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Sigma",
    template: "\\Sigma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sim",
    template: "\\sim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\simeq",
    template: "\\simeq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\smile",
    template: "\\smile",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqcap",
    template: "\\sqcap",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqcup",
    template: "\\sqcup",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqrt",
    template: "\\sqrt",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqsubset",
    template: "\\sqsubset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqsubseteq",
    template: "\\sqsubseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqsupset",
    template: "\\sqsupset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sqsupseteq",
    template: "\\sqsupseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\square",
    template: "\\square",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\stackrel",
    template: "\\stackrel",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\star",
    template: "\\star",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\subset",
    template: "\\subset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\subseteq",
    template: "\\subseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\subsetneq",
    template: "\\subsetneq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\succ",
    template: "\\succ",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\succcurlyeq",
    template: "\\succcurlyeq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\succeq",
    template: "\\succeq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\succsim",
    template: "\\succsim",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\sum",
    template: "\\sum",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supset",
    template: "\\supset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supseteq",
    template: "\\supseteq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supseteqq",
    template: "\\supseteqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supsetneq",
    template: "\\supsetneq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\supsetneqq",
    template: "\\supsetneqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\swarrow",
    template: "\\swarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\tau",
    template: "\\tau",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\textrm",
    template: "\\textrm",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\therefore",
    template: "\\therefore",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\theta",
    template: "\\theta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Theta",
    template: "\\Theta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\tilde",
    template: "\\tilde",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\times",
    template: "\\times",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\top",
    template: "\\top",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\triangle",
    template: "\\triangle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\triangleleft",
    template: "\\triangleleft",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\triangleq",
    template: "\\triangleq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\triangleright",
    template: "\\triangleright",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\ulcorner",
    template: "\\ulcorner",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\underbrace",
    template: "\\underbrace",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\underline",
    template: "\\underline",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\underset",
    template: "\\underset",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\unlhd",
    template: "\\unlhd",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\unrhd",
    template: "\\unrhd",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\uparrow",
    template: "\\uparrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\uplus",
    template: "\\uplus",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Upsilon",
    template: "\\Upsilon",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\urcorner",
    template: "\\urcorner",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varangle",
    template: "\\varangle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Varangle",
    template: "\\Varangle",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varepsilon",
    template: "\\varepsilon",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varkappa",
    template: "\\varkappa",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varliminf",
    template: "\\varliminf",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varlimsup",
    template: "\\varlimsup",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varnothing",
    template: "\\varnothing",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varphi",
    template: "\\varphi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varpi",
    template: "\\varpi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varrho",
    template: "\\varrho",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varsigma",
    template: "\\varsigma",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\varsubsetneqq",
    template: "\\varsubsetneqq",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vartheta",
    template: "\\vartheta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vDash",
    template: "\\vDash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vdash",
    template: "\\vdash",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vdots",
    template: "\\vdots",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vec",
    template: "\\vec",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\vee",
    template: "\\vee",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\wedge",
    template: "\\wedge",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\widehat",
    template: "\\widehat",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\widetilde",
    template: "\\widetilde",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\wp",
    template: "\\wp",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\xi",
    template: "\\xi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\Xi",
    template: "\\Xi",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\xrightarrow",
    template: "\\xrightarrow",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\zeta",
    template: "\\zeta",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\left[...\\right]",
    template: "\\left[${}\\right]",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  },
  {
    label: "\\left(...\\right)",
    template: "\\left(${}\\right)",
    mode: AutoCompleteMode.INLINE,
    env: AutoCompleteEnv.MATH
  }
];
----- ./react/shared/ui/codemirror-editor/codemirror-setup/basic-setup.ts -----

import {
  EditorView, KeyBinding, lineNumbers, highlightActiveLineGutter,
  highlightSpecialChars, drawSelection, dropCursor, rectangularSelection,
  crosshairCursor, highlightActiveLine, keymap
} from "@codemirror/view";
import { EditorState, Extension } from "@codemirror/state";
import { history, defaultKeymap, historyKeymap, indentWithTab } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { closeBrackets, autocompletion, closeBracketsKeymap, completionKeymap, Completion } from "@codemirror/autocomplete";
import { foldGutter, codeFolding, indentOnInput, syntaxHighlighting, defaultHighlightStyle, HighlightStyle, bracketMatching, foldKeymap, indentUnit } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { tags } from "@lezer/highlight";
import { markdown } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { vim } from "@replit/codemirror-vim";

import { MarkdownMathExtension } from "./markdown-parser";
import { defaultThemeOption, defaultLightThemeOption, defaultDarkThemeOption } from "./theme";
import { decorationsExtension } from "./decorations";
import { type BasicSetupOptions } from "./interfaces";

const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export const customLineNumbers = lineNumbers();
export const customCodeFolding = [foldGutter({ openText: "▾", closedText: "▸" }), codeFolding({ placeholderText: "* click to edit *" })] as const;

export const customMarkdown = markdown({ extensions: [GFM, ...MarkdownMathExtension] });

export const customSyntaxHighlighting = (darkMode: boolean) => {
  const extension1 = syntaxHighlighting(defaultHighlightStyle, { fallback: false });
  const highlightStyle = HighlightStyle.define([{ tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName], color: darkMode ? "#8080FF" : "#4960FF" }]);
  const extension2 = syntaxHighlighting(highlightStyle, { fallback: false });
  return [extension1, extension2] as const;
};
export const customSpellCheck = EditorView.contentAttributes.of({ spellcheck: "true" });

export const basicSetupOptionsDef: BasicSetupOptions = {
  readOnly: false, lineNumbers: false, lineWrapping: true, darkMode: false,
  keyMap: "sublime", foldGutter: false, autocapitalize: true,
  highlightActiveLineGutter: false, highlightSpecialChars: true, history: true,
  drawSelection: true, dropCursor: true, allowMultipleSelections: false,
  indentOnInput: false, syntaxHighlighting: true, bracketMatching: false,
  closeBrackets: true, autocompletion: true, rectangularSelection: true,
  crosshairCursor: true, highlightActiveLine: false, highlightSelectionMatches: true,
  closeBracketsKeymap: true, defaultKeymap: true, searchKeymap: true,
  historyKeymap: true, foldKeymap: true, completionKeymap: true,
  lintKeymap: true, inlineRenderingActive: true, batchChangesActive: false,
  spellcheck: true,
};

export const basicSetup = (options: Partial<BasicSetupOptions> = {}): Extension[] => {
  const finalOptions = { ...basicSetupOptionsDef, ...options };
  const extensions: Extension[] = [];
  const keymaps: KeyBinding[][] = [];

  if (finalOptions.keyMap === "vim") {
    extensions.push(vim());
  } else {
    if (finalOptions.closeBracketsKeymap) keymaps.push([...closeBracketsKeymap]);
    if (finalOptions.defaultKeymap) keymaps.push([...defaultKeymap]);
    if (finalOptions.searchKeymap) keymaps.push([...searchKeymap]);
    if (finalOptions.historyKeymap) keymaps.push([...historyKeymap]);
    if (finalOptions.foldKeymap) keymaps.push([...foldKeymap]);
    if (finalOptions.completionKeymap) keymaps.push([...completionKeymap]);
    if (finalOptions.lintKeymap) keymaps.push([...lintKeymap]);
    
    if (finalOptions.onSave) {
      keymaps.push([
        { 
          key: "Mod-s", 
          preventDefault: true, 
          run: () => { 
            finalOptions.onSave?.();
            return true; 
          } 
        },
      ]);
    }

    extensions.push(keymap.of([indentWithTab, ...keymaps.flat()]));
  }

  const fontSize: string = isIOS ? "16px" : "14px";
  const paddingTop = typeof finalOptions.cmContentPaddingTop === 'number' ? finalOptions.cmContentPaddingTop : 50;
  extensions.push(defaultThemeOption(paddingTop, fontSize));

  if (finalOptions.darkMode) {
    extensions.push(defaultDarkThemeOption);
  } else {
    extensions.push(defaultLightThemeOption);
  }

  if (finalOptions.lineNumbers) extensions.push(customLineNumbers);
  if (finalOptions.highlightActiveLineGutter) extensions.push(highlightActiveLineGutter());
  if (finalOptions.highlightSpecialChars) extensions.push(highlightSpecialChars());
  if (finalOptions.history) extensions.push(history());
  if (finalOptions.foldGutter) extensions.push(customCodeFolding as unknown as Extension);
  if (finalOptions.drawSelection) extensions.push(drawSelection());
  if (finalOptions.dropCursor) extensions.push(dropCursor());
  if (finalOptions.allowMultipleSelections) extensions.push(EditorState.allowMultipleSelections.of(true));
  if (finalOptions.indentOnInput) extensions.push(indentOnInput());
  if (finalOptions.syntaxHighlighting) extensions.push(customSyntaxHighlighting(finalOptions.darkMode) as unknown as Extension);
  if (finalOptions.bracketMatching) extensions.push(bracketMatching());
  if (finalOptions.closeBrackets) extensions.push(closeBrackets());
  if (finalOptions.autocompletion) extensions.push(autocompletion({ optionClass: (c: Completion) => c.type ? "" : "auto-complete-option-noicon" }));
  if (finalOptions.rectangularSelection) extensions.push(rectangularSelection());
  if (finalOptions.crosshairCursor) extensions.push(crosshairCursor());
  if (finalOptions.highlightActiveLine) extensions.push(highlightActiveLine());
  if (finalOptions.highlightSelectionMatches) extensions.push(highlightSelectionMatches());
  if (finalOptions.readOnly) extensions.push(EditorState.readOnly.of(true));
  if (finalOptions.autocapitalize) extensions.push(EditorView.contentAttributes.of({ autocapitalize: "on" }));
  if (finalOptions.spellcheck) extensions.push(customSpellCheck);
  if (finalOptions.tabSize) extensions.push(indentUnit.of("".padEnd(finalOptions.tabSize, " ")));
  
  extensions.push(customMarkdown);
  extensions.push(decorationsExtension);

  if (finalOptions.lineWrapping) {
    extensions.push(EditorView.lineWrapping);
  }
  
  return extensions.filter(Boolean);
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/decorations/index.ts -----
import { mathDecorations } from "./math-decorations";
import { markText } from "./mark-text";

export const decorationsExtension = [
  mathDecorations,
  markText
];
----- ./react/shared/ui/codemirror-editor/codemirror-setup/decorations/mark-text.ts -----
import { StateField, StateEffect } from "@codemirror/state";
import { EditorView, Decoration } from "@codemirror/view";

/** Effects can be attached to transactions to communicate with the extension */
export const addMarks = StateEffect.define();
export const filterMarks = StateEffect.define();

/** This value must be added to the set of extensions to enable this */
export const markText = StateField.define({
  create() { 
    return Decoration.none 
  },
  update(value, tr) {
    value = value.map(tr.changes);
    /** If this transaction adds or removes decorations, apply those changes */
    for (let effect of tr.effects) {
      if (effect.is(addMarks)) {
        value = value.update({
          add: effect.value, 
          sort: true
        });
      } else {
        if (effect.is(filterMarks)) {
          value = value.update({
            filter: effect.value
          })
        }
      }
    }
    return value
  },
  provide: f => EditorView.decorations.from(f)
});
----- ./react/shared/ui/codemirror-editor/codemirror-setup/decorations/math-decorations.ts -----

import { ensureSyntaxTree } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView
} from "@codemirror/view";
import { ViewPlugin,  ViewUpdate } from "@codemirror/view";
import {
  BLOCK_MATH,
  BLOCK_MULTI_MATH,
  BLOCK_DISPLAY_MATH,
  BLOCK_MATH_CONTENT_TAG,
  BLOCK_MULTI_MATH_CONTENT_TAG,
  BLOCK_MULTI_MATH_DELIMITER,
  EQUATION_MATH_NOT_NUMBER,
  EQUATION_MATH,
  INLINE_MATH,
  INLINE_MATH_CONTENT_TAG,
  INLINE_MATH_START_DELIMITER,
  INLINE_MATH_STOP_DELIMITER,
  INLINE_MULTI_MATH_CONTENT_TAG,
  INLINE_MULTI_MATH,
  INLINE_MULTI_MATH_START_DELIMITER,
  INLINE_MULTI_MATH_STOP_DELIMITER,
  textLatexCommands, latexEnvironments, mathEnvironments
} from "../markdown-parser/consts";
import { inlineMathLatexCommands } from "../auto-complete/dictionary";

const isLatexCommand = (command: string) => {
  if (textLatexCommands.findIndex(item => item === command) !== -1) {
    return true;
  }
  return inlineMathLatexCommands.findIndex(item => item.label === command) !== -1;
};

const isLatexEnvironment = (command: string) => {
  if (latexEnvironments.findIndex(item => item === command) !== -1) {
    return true;
  }
  return mathEnvironments.findIndex(item => item === command) !== -1;
};

const regionStartDecoration = Decoration.line({
  attributes: { class: 'cm-regionFirstLine' },
});

const regionStopDecoration = Decoration.line({
  attributes: { class: 'cm-regionLastLine' },
});


const inlineCodeDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineCode' },
});

const ignoreSpellCheck = Decoration.mark({
  attributes: { 
    class: 'cm-ignoreSpellCheck', 
    spellcheck: "false",
    style: "display: inline-block"
  },
});

const blockMathDecoration = Decoration.line({
  attributes: { class: 'cm-blockMath' },
});

const blockMathContentDecoration = Decoration.line({
  attributes: { class: 'cm-blockMathContent' },
});

const blockMathtDelimiterDecoration = Decoration.mark({
  attributes: { class: 'cm-blockMathDelimiter' },
});

const inlineMathDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMath' },
});

const inlineMathContentDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMathContent' },
});

const inlineMathStartDelimiterDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMathStartDelimiter' },
});

const inlineMathStopDelimiterDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMathStopDelimiter' },
});

const inlineMultiMathDecoration = Decoration.mark({
  attributes: { class: 'cm-inlineMultiMath' },
});

const inlineMultiMathContentDecoration = Decoration.line({
  attributes: { class: 'cm-inlineMultiMathContent' },
});

const blockQuoteDecoration = Decoration.line({
  attributes: { class: 'cm-blockQuote' },
});

function computeDecorations(view: EditorView) {
  const decorations: {
    pos: number;
    length?: number;
    decoration: Decoration
  }[] = [];

  const addDecorationToLines = (from: number, to: number, decoration: Decoration, asMark = false) => {
    let pos = from;
    while (pos <= to) {
      const line = view.state.doc.lineAt(pos);
      if (asMark) {
        decorations.push({
          pos: line.from,
          length: line.to - line.from,
          decoration,
        });
      } else {
        decorations.push({
          pos: line.from,
          decoration,
        });
      }
      pos = line.to + 1;
    }
  };

  const addDecorationToRange = (from: number, to: number, decoration: Decoration) => {
    decorations.push({
      pos: from,
      length: to - from,
      decoration,
    });
  };

  for (const { from, to } of view.visibleRanges) {
    ensureSyntaxTree(view.state, to)?.iterate({
      from, to,
      enter: node => {
        let blockDecorated = false;
        const viewFrom = Math.max(from, node.from);
        const viewTo = Math.min(to, node.to);
        let content = '';
        switch (node.name) {
          
          case BLOCK_MATH:
          case BLOCK_MULTI_MATH:
          case BLOCK_DISPLAY_MATH:
          case EQUATION_MATH_NOT_NUMBER:
          case EQUATION_MATH:
            addDecorationToLines(viewFrom, viewTo, blockMathDecoration);
            blockDecorated = true;
            break;
          case BLOCK_MATH_CONTENT_TAG:
          case BLOCK_MULTI_MATH_CONTENT_TAG:
            addDecorationToLines(viewFrom, viewTo, blockMathContentDecoration);
            blockDecorated = true;
            break;
          
          case BLOCK_MULTI_MATH_DELIMITER:
            addDecorationToRange(viewFrom, viewTo, blockMathtDelimiterDecoration);
            break;
          case "BLOCK_MULTI_MATH_VERBOSE_DELIMITER": // This case name is a string, not a constant
            break;

          case 'Blockquote':
            addDecorationToLines(viewFrom, viewTo, blockQuoteDecoration);
            blockDecorated = true;
            break;
          case INLINE_MULTI_MATH:
            addDecorationToRange(viewFrom, viewTo, inlineMultiMathDecoration);
            break;
          case INLINE_MULTI_MATH_CONTENT_TAG:
            addDecorationToRange(viewFrom, viewTo, inlineMultiMathContentDecoration);
            break;
          case INLINE_MATH:
            addDecorationToRange(viewFrom, viewTo, inlineMathDecoration);
            break;
          case INLINE_MATH_CONTENT_TAG:
            addDecorationToRange(viewFrom, viewTo, inlineMathContentDecoration);
            break;
          case INLINE_MATH_START_DELIMITER:
          case INLINE_MULTI_MATH_START_DELIMITER:
            addDecorationToRange(viewFrom, viewTo, inlineMathStartDelimiterDecoration);
            break;
          case INLINE_MATH_STOP_DELIMITER:
          case INLINE_MULTI_MATH_STOP_DELIMITER:
            addDecorationToRange(viewFrom, viewTo, inlineMathStopDelimiterDecoration);
            break;
          case 'InlineCode':
            addDecorationToRange(viewFrom, viewTo, inlineCodeDecoration);
            break;
          case 'tagName':
            content = view.state.doc.sliceString(viewFrom, viewTo);
            if (isLatexCommand(content)) {
              addDecorationToRange(viewFrom, viewTo, ignoreSpellCheck);
            }
            break;          
          case 'variableName.special':
            content = view.state.doc.sliceString(viewTo, viewTo);
            if (isLatexEnvironment(content)) {
              addDecorationToRange(viewFrom, viewTo, ignoreSpellCheck);
            }
            break;
        }

        if (blockDecorated) {
          if (viewFrom === node.from) {
            addDecorationToLines(viewFrom, viewFrom, regionStartDecoration);
          }
          if (viewTo === node.to) {
            addDecorationToLines(viewTo, viewTo, regionStopDecoration);
          }
        }
      },
    });
  }
  const decorationBuilder = new RangeSetBuilder<Decoration>();
  try {
    decorations.sort((a, b) => a.pos - b.pos);
    for (const { pos, length, decoration } of decorations) {
      if (decoration.spec.line) {
         decorationBuilder.add(pos, pos, decoration);
      } else if (length && length > 0) {
        decorationBuilder.add(pos, pos + length, decoration);
      }
    }
  } catch (err) {
    console.error(err);
  }
  return decorationBuilder.finish();
}

export const mathDecorations = ViewPlugin.fromClass(class {
  public decorations: DecorationSet;

  public constructor(view: EditorView) {
    this.decorations = computeDecorations(view);
  }

  public update(viewUpdate: ViewUpdate) {
    if (viewUpdate.docChanged || viewUpdate.viewportChanged || viewUpdate.geometryChanged) {
      this.decorations = computeDecorations(viewUpdate.view);
    }
  }
}, {
  decorations: pluginVal => pluginVal.decorations,
});
----- ./react/shared/ui/codemirror-editor/codemirror-setup/helpers.ts -----



/**
 * mathpix-markdown-it/lib/markdown/common 의 isSpace 함수를 대체합니다.
 * @param code 문자 코드
 */
export const isSpace = (code: number): boolean => {
  switch (code) {
    case 0x09: // \t
    case 0x0a: // \n
    case 0x0b:
    case 0x0c: // \f
    case 0x0d: // \r
    case 0x20: // ' '
    case 0xa0:
    case 0x1680:
    case 0x2000:
    case 0x2001:
    case 0x2002:
    case 0x2003:
    case 0x2004:
    case 0x2005:
    case 0x2006:
    case 0x2007:
    case 0x2008:
    case 0x2009:
    case 0x200a:
    case 0x202f:
    case 0x205f:
    case 0x3000:
      return true;
  }
  return false;
}

/**
 * mathpix-markdown-it/lib/markdown/utils의 헬퍼 함수들을 대체합니다.
 */
export const beginTag = (ch: string, encode = false) => {
  const c = encode ? `\\\\${ch}` : ch; // 💡 정규식에 사용되므로 백슬래시 이스케이프
  return new RegExp(`\\\\begin\\s*{${c}}`);
};

export const endTag = (ch: string, encode = false) => {
  const c = encode ? `\\\\${ch}` : ch; // 💡 정규식에 사용되므로 백슬래시 이스케이프
  return new RegExp(`\\\\end\\s*{${c}}`);
};

/**
 * 💡💡💡 BUG FIX: 이 함수가 문제의 핵심이었습니다. 
 * 4번째 인자를 받도록 하고, 인라인 코드 블록(```) 상태를 추적하는 로직으로 강화합니다.
 */
export const findOpenCloseTags = (str: string, openTag: RegExp, closeTag: RegExp, pending: string = '') => {
    const arrOpen: { posStart: number, posEnd: number }[] = [];
    const arrClose: { posStart: number, posEnd: number }[] = [];
    
    let openCode = pending ? 1 : 0; 
    
    for (let i = 0; i < str.length; i++) {
        if (str[i] === '`') {
            openCode = 1 - openCode;
            continue; 
        }

        if (openCode) {
            continue;
        }
        
        const sub = str.substring(i);
        const matchOpen = sub.match(openTag);
        if (matchOpen && matchOpen.index === 0) {
            const end = i + matchOpen[0].length;
            arrOpen.push({ posStart: i, posEnd: end });
            i = end - 1; 
            continue;
        }

        const matchClose = sub.match(closeTag);
        if (matchClose && matchClose.index === 0) {
            const end = i + matchClose[0].length;
            arrClose.push({ posStart: i, posEnd: end });
            i = end - 1;
            continue;
        }
    }

    return { arrOpen, arrClose, pending: openCode ? '`' : '' };
};


export const findOpenCloseTagsMathEnvironment = (str: string, openTag: RegExp, closeTag: RegExp) => {
    return findOpenCloseTags(str, openTag, closeTag);
}

/**
 * 짝이 맞는 괄호를 찾아 그 사이의 내용을 반환합니다.
 */
export const findEndMarker = (str: string, startPos: number = 0, beginMarker: string = "{", endMarker: string = "}", onlyEnd = false) => {
  if (startPos >= str.length) return { res: false, content: '' };
  
  if (str[startPos] !== beginMarker && !onlyEnd) {
    return { res: false, content: '' };
  }
  
  let content: string = '';
  let nextPos: number = startPos;
  let openBrackets = 1;
  let openCode = 0;

  for (let i = startPos + 1; i < str.length; i++) {
    const chr = str[i];
    nextPos = i;
    if (chr === '`') {
      openCode = 1 - openCode;
    }
    if (openCode === 0) {
      if (chr === beginMarker) {
        openBrackets++;
      } else if (chr === endMarker) {
        openBrackets--;
        if (openBrackets === 0) {
          break;
        }
      }
    }
    content += chr;
  }

  if (openBrackets > 0) {
    return { res: false, content: content };
  }

  return {
    res: true,
    content: content,
    nextPos: nextPos + endMarker.length
  };
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/interfaces.ts -----

export interface BasicSetupOptions {
  readOnly: boolean;
  lineNumbers: boolean;
  lineWrapping: boolean;
  darkMode: boolean;
  keyMap: 'sublime' | 'vim';
  foldGutter: boolean;
  autocapitalize: boolean;
  highlightActiveLineGutter: boolean;
  highlightSpecialChars: boolean;
  history: boolean;
  drawSelection: boolean;
  dropCursor: boolean;
  allowMultipleSelections: boolean;
  indentOnInput: boolean;
  syntaxHighlighting: boolean;
  bracketMatching: boolean;
  closeBrackets: boolean;
  autocompletion: boolean;
  rectangularSelection: boolean;
  crosshairCursor: boolean;
  highlightActiveLine: boolean;
  highlightSelectionMatches: boolean;
  closeBracketsKeymap: boolean;
  defaultKeymap: boolean;
  searchKeymap: boolean;
  historyKeymap: boolean;
  foldKeymap: boolean;
  completionKeymap: boolean;
  lintKeymap: boolean;
  inlineRenderingActive: boolean;
  batchChangesActive: boolean;
  spellcheck: boolean;
  tabSize?: number;
  cmContentPaddingTop?: number;
  onSave?: () => void;
}
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/block-math-config.ts -----
import { foldNodeProp } from "@codemirror/language";
import {
  MarkdownConfig,
  BlockContext, Line, LeafBlock,
} from '@lezer/markdown';
import { wrappedTeXParser } from "./wrapped-TeXParser";
import {
  FOLDE_BLOCKS,
  BLOCK_MATH,
  BLOCK_MATH_CONTENT_TAG, 
  MATH_BLOCK_START_REGEX,
  MATH_BLOCK_STOP_REGEX,
  mathTag
} from "./consts";

export const BlockMathConfig: MarkdownConfig = {
  props: [
    foldNodeProp.add({
      Block: (node) => {
        if (FOLDE_BLOCKS.indexOf(node.name) === -1) {
          return null;
        }
      },
      BlockMath: (node) => ({ from: node.from + 2, to: node.to - 2 }),
      BlockMathContent: () => null
    })
  ],
  defineNodes: [
    {
      name: BLOCK_MATH,
      block: true,
      style: mathTag,
    },
    {
      name: BLOCK_MATH_CONTENT_TAG,
    },

  ],
  parseBlock: [{
    name: BLOCK_MATH,
    before: 'HorizontalRule',

    parse(cx: BlockContext, line: Line): boolean {
      const lineLength = line.text.length;
      const delimLen = 2;
      const mathStartMatch = MATH_BLOCK_START_REGEX.exec(line.text);
      if (mathStartMatch) {
        const start = cx.lineStart + mathStartMatch[0].length;
        let stop: number;
        let endMatch = MATH_BLOCK_STOP_REGEX.exec(
          line.text.substring(mathStartMatch[0].length)
        );
        if (endMatch) {
          stop = cx.lineStart + lineLength - endMatch[0].length;
        } else {
          let hadNextLine = false;
          do {
            hadNextLine = cx.nextLine();
            if (!line.text) {
              break;
            }
            endMatch = hadNextLine ? MATH_BLOCK_STOP_REGEX.exec(line.text) : null;
          }
          while (hadNextLine && endMatch == null);
          
          if (!endMatch) {
            return false;
          }
          if (hadNextLine && endMatch) {
            stop = cx.lineStart + line.text.length - endMatch[0].length;
          } else {
            stop = cx.lineStart;
          }
        }
        const contentElem = cx.elt(BLOCK_MATH_CONTENT_TAG, start, stop);
        cx.addElement(
          cx.elt(BLOCK_MATH, start - delimLen, stop + delimLen, [contentElem])
        );
        cx.nextLine();
        return true;
      }
      return false;
    },
    endLeaf(_cx: BlockContext, line: Line, _leaf: LeafBlock): boolean {
      return MATH_BLOCK_START_REGEX.exec(line.text) != null;
    },
  }],
  wrap: wrappedTeXParser(BLOCK_MATH_CONTENT_TAG),
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/block-multiMath-config.ts -----

import {
  type MarkdownConfig,
  type BlockContext, type Line, type LeafBlock,
} from '@lezer/markdown';
import { foldNodeProp } from "@codemirror/language";
import { wrappedTeXParser } from "./wrapped-TeXParser";
import {
  BLOCK_DISPLAY_MATH,
  EQUATION_MATH,
  EQUATION_MATH_NOT_NUMBER,
  MULTI_MATH_START_REGEX,
  BLOCK_TABLE,
  BLOCK_TABULAR,
  BLOCK_FIGURE,
  BLOCK_CENTER,
  BLOCK_LEFT,
  BLOCK_RIGHT,
  BLOCK_LIST,
  BLOCK_TEXT,
  BLOCK_MULTI_MATH,
  BLOCK_MULTI_MATH_CONTENT_TAG,
  BLOCK_TEXT_LATEX_CONTENT_TAG,
  BLOCK_MULTI_MATH_VERBOSE_DELIMITER,
  BLOCK_MULTI_MATH_DELIMITER,
  BLOCK_MULTI_MATH_DELIMITER_COMMAND,
  BLOCK_MULTI_MATH_DELIMITER_BRACE,
  BLOCK_MULTI_MATH_DELIMITER_TYPE,
  mathTag,
  latexTag,
  delimiterBraceTag,
  aquaTag,
  contentTag,
  latexEnvironments,
  mathEnvironments,
  EQUATION_MATH_START_REGEX
} from "./consts";
import { type SyntaxNode } from '@lezer/common';
import { type EditorState } from '@codemirror/state';

const getFoldData = (node: SyntaxNode, state: EditorState) => {
  const content = state.doc.sliceString(node.from, node.to);
  const match = content.match(EQUATION_MATH_START_REGEX);
  
  if (!match || !match[1]) return null;
  
  const endMarker = `\\end{${match[1]}}`;
  const from = match.index !== undefined ? node.from + match.index + match[0].length : node.from;
  const toIndex = content.lastIndexOf(endMarker);
  
  if (toIndex === -1) return null;
  
  const to = node.from + toIndex;
  
  return from < to ? { from, to } : null;
};


export const BlockMultiMathConfig: MarkdownConfig = {
  props: [
    foldNodeProp.add({
      EquationMath: getFoldData,
      EquationMathNotNumber: getFoldData,
      BlockTabular: getFoldData,
      BlockTable: getFoldData,
      BlockFigure: getFoldData,
    }),
  ],
  defineNodes: [
    { name: BLOCK_MULTI_MATH, block: true, style: mathTag },
    { name: BLOCK_DISPLAY_MATH, block: true, style: mathTag },
    { name: EQUATION_MATH_NOT_NUMBER, block: true, style: mathTag },
    { name: EQUATION_MATH, block: true, style: mathTag },
    { name: BLOCK_TABLE, block: true, style: mathTag },
    { name: BLOCK_TABULAR, block: true, style: mathTag },
    { name: BLOCK_FIGURE, block: true, style: mathTag },
    { name: BLOCK_CENTER, block: true, style: mathTag },
    { name: BLOCK_LEFT, block: true, style: mathTag },
    { name: BLOCK_RIGHT, block: true, style: mathTag },
    { name: BLOCK_LIST, block: true, style: mathTag },
    { name: BLOCK_TEXT, block: true, style: mathTag },
    { name: BLOCK_MULTI_MATH_CONTENT_TAG, style: contentTag },
    { name: BLOCK_TEXT_LATEX_CONTENT_TAG, style: contentTag },
    { name: BLOCK_MULTI_MATH_VERBOSE_DELIMITER, style: latexTag },
    { name: BLOCK_MULTI_MATH_DELIMITER, style: latexTag },
    { name: BLOCK_MULTI_MATH_DELIMITER_COMMAND, style: latexTag },
    { name: BLOCK_MULTI_MATH_DELIMITER_BRACE, style: delimiterBraceTag },
    { name: BLOCK_MULTI_MATH_DELIMITER_TYPE, style: aquaTag },
  ],
  parseBlock: [{
    name: "MultiMath",
    parse(cx: BlockContext, line: Line): boolean {
      const startMatch = line.text.slice(line.pos).match(MULTI_MATH_START_REGEX);
      if (!startMatch) return false;

      const environment = startMatch[1] || (startMatch[0] === "\\[" || startMatch[0] === "\\\\[" ? "display" : null);
      if (!environment) return false;

      const endTagStr = environment === 'display' ? (startMatch[0] === "\\[" ? "\\]" : "\\\\]") : `\\end{${environment}}`;
      const endRegex = new RegExp(endTagStr.replace(/\\/g, '\\\\'));

      const startPos = cx.lineStart + line.pos + (startMatch.index || 0);
      const startDelimLen = startMatch[0].length;
      
      let endMatch = line.text.substring(line.pos + (startMatch.index || 0) + startDelimLen).match(endRegex);

      if (!endMatch) {
          let hadNextLine = false;
          do {
            hadNextLine = cx.nextLine();
            if (!hadNextLine) break; // 문서 끝에 도달
            endMatch = line.text.match(endRegex);
          } while (!endMatch);
      }
      
      if (!endMatch) return false; // 문서 끝까지 닫는 태그를 찾지 못함

      const stopPos = cx.lineStart + (endMatch.index || 0);

      let nodeType: string = BLOCK_MULTI_MATH;
       if (environment === 'display') {
        nodeType = BLOCK_DISPLAY_MATH;
      } else if (mathEnvironments.includes(environment)) {
        nodeType = environment.endsWith('*') ? EQUATION_MATH_NOT_NUMBER : EQUATION_MATH;
      } else if (latexEnvironments.includes(environment)) {
          switch(environment) {
              case "table": nodeType = BLOCK_TABLE; break;
              case "tabular": nodeType = BLOCK_TABULAR; break;
              case "figure": nodeType = BLOCK_FIGURE; break;
              case "center": nodeType = BLOCK_CENTER; break;
              case "left": nodeType = BLOCK_LEFT; break;
              case "right": nodeType = BLOCK_RIGHT; break;
              case "itemize": case "enumerate": nodeType = BLOCK_LIST; break;
              default: nodeType = BLOCK_TEXT;
          }
      } else {
        nodeType = BLOCK_TEXT;
      }
      
      const children = [];

      if (startMatch[1]) {
        const startDelimContent = [];
        startDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_COMMAND, startPos, startPos + 6)); // \begin
        startDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_BRACE, startPos + 6, startPos + 7)); // {
        startDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_TYPE, startPos + 7, startPos + 7 + startMatch[1].length));
        startDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_BRACE, startPos + 7 + startMatch[1].length, startPos + startDelimLen)); // }
        children.push(cx.elt(BLOCK_MULTI_MATH_VERBOSE_DELIMITER, startPos, startPos + startDelimLen, startDelimContent));
      } else {
        children.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER, startPos, startPos + startDelimLen));
      }

      const contentTagType = nodeType === BLOCK_TEXT ? BLOCK_TEXT_LATEX_CONTENT_TAG : BLOCK_MULTI_MATH_CONTENT_TAG;
      children.push(cx.elt(contentTagType, startPos + startDelimLen, stopPos));

      const endDelimLen = endMatch[0].length;
      if (startMatch[1]) { // \begin으로 시작했다면 \end로 끝나야 함
        const endDelimContent = [];
        endDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_COMMAND, stopPos, stopPos + 4)); // \end
        endDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_BRACE, stopPos + 4, stopPos + 5)); // {
        endDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_TYPE, stopPos + 5, stopPos + 5 + startMatch[1].length));
        endDelimContent.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER_BRACE, stopPos + 5 + startMatch[1].length, stopPos + endDelimLen)); // }
        children.push(cx.elt(BLOCK_MULTI_MATH_VERBOSE_DELIMITER, stopPos, stopPos + endDelimLen, endDelimContent));
      } else {
        children.push(cx.elt(BLOCK_MULTI_MATH_DELIMITER, stopPos, stopPos + endDelimLen));
      }

      cx.addElement(cx.elt(nodeType, startPos, stopPos + endDelimLen, children));
      
      cx.nextLine();
      return true;
    },
    endLeaf(_cx: BlockContext, line: Line, _leaf: LeafBlock): boolean {
      return MULTI_MATH_START_REGEX.test(line.text.slice(line.pos));
    },
  }],
  wrap: wrappedTeXParser(BLOCK_MULTI_MATH_CONTENT_TAG),
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/block-yaml-config.ts -----
import { MarkdownConfig } from "@lezer/markdown";
import { yaml } from "@codemirror/legacy-modes/mode/yaml";
import { foldInside, StreamLanguage, foldNodeProp } from "@codemirror/language";
import { styleTags, tags } from "@lezer/highlight"; 

const frontMatterFence = /^-------\s*$/m;

const yamlNodes = [
  "YAMLatom",
  { name: "YAMLmeta", block: true },
  "YAMLnumber",
  "YAMLkeyword",
  "YAMLdef",
  "YAMLcomment",
  "YAMLstring",
];

/**
 * Lezer Markdown extension for YAML frontmatter support. This includes support
 * for parsing, syntax highlighting and folding.
 */
export const blockYamlConfig: MarkdownConfig = {
  props: [
    styleTags({
      YAMLnumber: tags.number,
      YAMLkeyword: tags.keyword,
      YAMLdef: tags.definition(tags.labelName),
      YAMLcomment: tags.comment,
      YAMLstring: tags.string,
      YAMLatom: tags.atom,
      YAMLmeta: tags.meta,
      FrontmatterMark: tags.processingInstruction,
    }),
    foldNodeProp.add({
      Frontmatter: foldInside,
      FrontmatterMark: () => null,
    }),
  ],
  defineNodes: [
    { name: "Frontmatter", block: true },
    "FrontmatterMark",
    ...yamlNodes,
  ],
  parseBlock: [
    {
      name: "Frontmatter",
      before: "HorizontalRule",
      parse: (cx, line) => {
        let matter = "";
        const yamlParser = StreamLanguage.define(yaml).parser;
        const startPos = cx.lineStart;
        let endPos: number;
        if (startPos !== 0) return false;
        if (!frontMatterFence.test(line.text)) return false;
        while (cx.nextLine()) {
          if (frontMatterFence.test(line.text)) {
            const parsedYaml = yamlParser.parse(matter);
            const children = [];
            children.push(cx.elt("FrontmatterMark", startPos, startPos + 8));
            const { length } = matter;
            parsedYaml.iterate({
              enter: ({ type, from, to }) => {
                if (type.name === "Document") return;
                if (startPos + to > length) return;
                children.push(
                  cx.elt(
                    "YAML" + type.name,
                    startPos + 8 + from,
                    startPos + 8 + to,
                  ),
                );
              },
            });
            endPos = cx.lineStart + line.text.length;
            children.push(cx.elt("FrontmatterMark", cx.lineStart, endPos));
            cx.addElement(cx.elt("Frontmatter", startPos, endPos, children));
            return false;
          } else {
            matter += line.text + "\n";
          }
        }
        return true;
      },
    },
  ],
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/consts.ts -----
import { tags, Tag } from "@lezer/highlight";
import { StreamLanguage } from "@codemirror/language";
import { stexMath } from "@codemirror/legacy-modes/mode/stex";

export const MATH_BLOCK_START_REGEX = /^(?:\s*[>]\s*)?\$\$/; // (?:[>]\s*)?: Optionally allow block math lines to start with '> '
export const MATH_BLOCK_STOP_REGEX = /\$\$\s*$/;
export const MULTI_MATH_START_REGEX = /^(?:\\\[|\[|\\begin\{([^}]*)\})/;
export const MULTI_MATH_START_REGEX_G = /(?:\\\[|\[|\\begin\{([^}]*)\})/;
export const EQUATION_MATH_START_REGEX = /^(?:\\begin\{([^}]*)\})/;
export const regExpMultiMath = /(?:\\\[|\[|\\begin\{([^}]*)\})/;
export const imageRegex = /!\[.*?\]\((?<url>.*?)\)/;

export const DOLLAR_SIGN_CHAR_CODE = 36;
export const BACKSLASH_CHAR_CODE = 92;

export const TEX_LANGUAGE = StreamLanguage.define(stexMath);

export const EQUATION_MATH_NOT_NUMBER = "EquationMathNotNumber"; //equation_math_not_number 
export const EQUATION_MATH = "EquationMath"; //equation_math 
export const REFERENCE_NOTE = "ReferenceNote"; //reference_note
export const BLOCK_DISPLAY_MATH = "BlockDisplayMath";
export const INLINE_DISPLAY_MATH = "InlineDisplayMath";

export const BLOCK_MATH = 'BlockMath';
export const BLOCK_MATH_CONTENT_TAG = 'BlockMathContent';

export const BLOCK_MULTI_MATH = "BlockMultiMath";
export const BLOCK_MULTI_MATH_CONTENT_TAG = 'BlockMultiMathContent';
export const BLOCK_TEXT_LATEX_CONTENT_TAG = 'BlockTextLatexContent';
export const BLOCK_MULTI_MATH_DELIMITER = 'BlockMultiMathDelimiter';
export const BLOCK_MULTI_MATH_VERBOSE_DELIMITER = 'BlockMultiMathVerboseDelimiter'; // \begin{...}, \end{...}
export const BLOCK_MULTI_MATH_DELIMITER_COMMAND = 'BlockMultiMathDelimiterCommand'; // For `\begin`, `\end` in \begin{...} \end{...}
export const BLOCK_MULTI_MATH_DELIMITER_BRACE = 'BlockMultiMathDelimiterBrace'; // For `{`, `}` in \begin{...} \end{...}
export const BLOCK_MULTI_MATH_DELIMITER_TYPE = 'BlockMultiMathDelimiterType'; // For ... in \begin{...} \end{...}

export const BLOCK_TABLE = 'BlockTable';
export const BLOCK_CENTER = 'BlockCenter';
export const BLOCK_LEFT = 'BlockLeft';
export const BLOCK_RIGHT = 'BlockRight';

export const BLOCK_TABULAR = 'BlockTabular';
export const BLOCK_FIGURE = 'BlockFigure';
export const BLOCK_LIST = 'BlockList';
export const BLOCK_ABSTRACT = 'BlockAbstract';
export const BLOCK_THEOREM = 'BlockTheorem';
export const BLOCK_TEXT = 'BlockText';

export const INLINE_MATH = 'InlineMath'; //inline_math
export const INLINE_MATH_CONTENT_TAG = 'InlineMathContent';
export const INLINE_MATH_START_DELIMITER = 'InlineMathStartDelimiter';
export const INLINE_MATH_STOP_DELIMITER = 'InlineMathStopDelimiter';

export const INLINE_MULTI_MATH = 'InlineMultiMath';
export const INLINE_MULTI_MATH_CONTENT_TAG = 'InlineMultiMathContent';
export const INLINE_MULTI_MATH_START_DELIMITER = 'InlineMultiMathStartDelimiter';
export const INLINE_MULTI_MATH_STOP_DELIMITER = 'InlineMultiMathStopDelimiter';

export const INLINE_IMAGE_PARAMS = 'ImageParams';

export const mathTag = Tag.define(tags.keyword);
export const latexTag = Tag.define(tags.tagName);
export const aquaTag = Tag.define(tags.macroName);
export const contentTag = Tag.define(tags.content);
export const delimiterBraceTag = Tag.define(tags.contentSeparator);

export const inlineMathTag = Tag.define(mathTag);
export const inlineMathTagDelimiter = Tag.define(tags.keyword);

export const FOLDE_BLOCKS = [
  BLOCK_MULTI_MATH,
  BLOCK_DISPLAY_MATH,
  BLOCK_MATH,
  EQUATION_MATH_NOT_NUMBER,
  EQUATION_MATH
];

export const latexEnvironments = [
  "figure",
  "table",
  "tabular",
  "enumerate",
  "itemize",
  "center",
  "left",
  "right",
];

/** https://docs.mathjax.org/en/v3.0-latest/input/tex/macros/index.html#environments */
export const mathEnvironments = [
  "align",
  "align*",
  "alignat",
  "alignat*",
  "aligned",
  "alignedat",
  "array",
  "Bmatrix",
  "bmatrix",
  "cases",
  "eqnarray",
  "eqnarray*",
  "equation",
  "equation*",
  "gather",
  "gather*",
  "gathered",
  "matrix",
  "multline",
  "multline*",
  "pmatrix",
  "smallmatrix",
  "split",
  "subarray",
  "Vmatrix",
  "vmatrix"
];

export const reNewTheorem: RegExp = /^\\newtheorem\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<print>[^}]*)\}/;
export const reNewTheoremG: RegExp = /\\newtheorem([^}]*)\s{0,}\{(?<name>[^}]*)\}/
export const reNewTheoremNumbered: RegExp = /^\\newtheorem\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<print>[^}]*)\}\s{0,}\[(?<numbered>[^\]]*)\]/;
export const reNewTheoremNumbered2: RegExp = /^\\newtheorem\s{0,}\{(?<name>[^}]*)\}\s{0,}\[(?<numbered>[^\]]*)\]\s{0,}\{(?<print>[^}]*)\}/;
export const reNewTheoremUnNumbered: RegExp = /^\\newtheorem\*\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<print>[^}]*)\}/;
export const reTheoremStyle: RegExp = /^\\theoremstyle\s{0,}\{(definition|plain|remark)\}/;
export const reTheoremStyleG: RegExp = /\\theoremstyle\s{0,}\{(definition|plain|remark)\}/;
export const reNewCommandQedSymbol: RegExp = /^\\renewcommand\s{0,}\\qedsymbol\s{0,}\{(?<qed>[^}]*)\}/;
export const reNewCommandQedSymbolG: RegExp = /\\renewcommand\s{0,}\\qedsymbol\s{0,}\{(?<qed>[^}]*)\}/;
export const reSetCounter: RegExp = /^\\setcounter\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<number>[^}]*)\}/;
export const reSetCounterG: RegExp = /\\setcounter\s{0,}\{(?<name>[^}]*)\}\s{0,}\{(?<number>[^}]*)\}/;
export const reLatexFootnotes: RegExp = /^\\(?:footnotemark|footnotetext|footnote|blfootnotetext)/;
export const reNumber = /^-?\d+$/;

export const textLatexCommands = [
  "\\title",
  "\\author",
  "\\section",
  "\\section*",
  "\\subsection",
  "\\subsection*",
  "\\subsubsection",
  "\\subsubsection*",
  "\\pagebreak",
  "\\eqref",
  "\\ref",
  "\\label",
  "\\theoremstyle",
  "\\setcounter",
  "\\newtheorem*",
  "\\newtheorem",
  "\\renewcommand",
  "\\qedsymbol",
  "\\footnotemark",
  "\\footnotetext",
  "\\footnote",
  "\\footnotetext",
  "\\textit",
  "\\textbf",
  "\\texttt",
  "\\text",
  "\\underline",
  "\\uline",
  "\\uuline",
  "\\uwave",
  "\\dashuline",
  "\\dotuline",
  "\\sout",
  "\\xout",
];
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/index.ts -----
import { MarkdownConfig } from "@lezer/markdown";
import { blockYamlConfig } from "./block-yaml-config";
import { BlockMathConfig } from "./block-math-config";
import { BlockMultiMathConfig } from "./block-multiMath-config";
import { InlineMathConfig } from "./inline-math-config";
import { InlineMultiMathConfig } from "./inline-multiMath-config";
import { inlineLatexConfig } from "./inline-latex-config";
import { InlineImageConfig } from "./inline-image-config";
import { inlineLatexFootnotesConfig } from "./inline-latex-footnotes";
import { markdownHighlight } from "./markdown";

/** Markdown configuration for block and inline math support. */
const MarkdownMathExtension: MarkdownConfig[] = [
  blockYamlConfig,
  BlockMathConfig,
  BlockMultiMathConfig,
  InlineMultiMathConfig,
  InlineMathConfig,
  inlineLatexConfig,
  InlineImageConfig,
  inlineLatexFootnotesConfig,
  markdownHighlight
];

export { MarkdownMathExtension };
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/inline-image-config.ts -----
import { MarkdownConfig } from "@lezer/markdown";
import { INLINE_IMAGE_PARAMS, inlineMathTag } from "./consts";

export const InlineImageConfig: MarkdownConfig = {
  defineNodes: [
    {
      name: INLINE_IMAGE_PARAMS,
      style: inlineMathTag,
    },
  ],
  parseInline: [
    {
      name: INLINE_IMAGE_PARAMS,
      after: "LinkEnd",

      parse(cx: any, next: number, pos: number): number {
        if (next !== 123 /* '{' */) {
          return -1;
        }
        if (!cx.parts?.length) {
          return -1;
        }
        const elBefore = cx.parts.length - 1 >= 0 ? cx.parts[cx.parts.length - 1] : null;
        if (!elBefore || elBefore.type !== 28 /* Image */) {
          return - 1;
        }
        const start = pos;
        const end = cx.end;
        pos++;
        for (; pos < end && cx.char(pos) !== 125; pos++) {
          if (cx.char(pos) === 125) {
            break;
          }
        }
        pos++;
        const el = cx.elt(INLINE_IMAGE_PARAMS, start, pos);
        elBefore.children.push(el);
        elBefore.to = pos;
        return pos;
      }
    },
  ]
}; 
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/inline-latex-config.ts -----

import { MarkdownConfig, InlineContext } from "@lezer/markdown";
import {
  inlineMathTag,
  latexTag,
  contentTag,
  delimiterBraceTag,
  reNewTheorem,
  reNewTheoremNumbered,
  reNewTheoremNumbered2,
  reNewTheoremUnNumbered,
  reTheoremStyle,
  reNewCommandQedSymbol,
  reSetCounter
} from "./consts";
import { wrappedTeXParser } from "./wrapped-TeXParser";
import { findEndMarker } from "../helpers";

export const inlineLatexConfig: MarkdownConfig = {
  defineNodes: [
    {
      name: "inlineTitle",
      style: inlineMathTag
    },
    {
      name: "inlineAuthor",
      style: inlineMathTag
    },
    {
      name: "inlineNewTheorem",
      style: inlineMathTag
    },
    {
      name: "inlineTheoremStyle",
      style: inlineMathTag
    },
    {
      name: "inlineSetCounter",
      style: inlineMathTag
    },
    {
      name: "inlineNewCommandQedSymbol",
      style: inlineMathTag
    },
    {
      name: "inlineLatexContent",
      style: inlineMathTag
    },
    {
      name: "inlineTextTypes",
      style: inlineMathTag
    },
    {
      name: "inlineLatexCommand",
      style: latexTag
    },
    {
      name: "inlineLatexBrace",
      style: delimiterBraceTag
    },
    {
      name: "inlineTextContent",
      style: contentTag
    }
  ],
  parseInline: [{
    name: "inlineTitle",
    after: 'InlineCode',
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const pickTag: RegExp = /\\(?:title\{([^}]*)\}|section\*?\{([^}]*)\}|subsection\*?\{([^}]*)\}|subsubsection\*?\{([^}]*)\})/;
      const match = src.match(pickTag);
      const contentMatch = match?.find((submatch, i) => i > 0 && submatch !== undefined);
      if (!match || contentMatch === undefined) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentStartPos = endMarkerPos - contentMatch.length - 1;
      const contentEndPos = endMarkerPos - 1;
      const commandElem = cx.elt('inlineLatexCommand', startMathPos, contentStartPos - 1);
      const brace1Elem = cx.elt('inlineLatexBrace', contentStartPos - 1, contentStartPos);
      const brace2Elem = cx.elt('inlineLatexBrace', contentEndPos, endMarkerPos);
      const contentElem = cx.elt("inlineTextContent", contentStartPos, contentEndPos);
      return cx.addElement(cx.elt("inlineTitle", startMathPos, endMarkerPos, [
        commandElem, brace1Elem, contentElem, brace2Elem
      ]));
    }
  },
  {
    name: "inlineTextTypes",
    after: 'InlineCode',
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const pickTag: RegExp = /\\(?:textit|textbf|texttt|text|underline|uline|uuline|uwave|dashuline|dotuline|sout|xout)/;
      const match = src
        .match(pickTag);
      if (!match) {
        return -1;
      }
      let { res = false, nextPos = 0, content } = findEndMarker(src, match[0].length);
      if (!res) {
        return -1;
      }
      const endMarkerPos = startMathPos + nextPos;
      const contentStartPos = endMarkerPos - content.length - 1;
      const contentEndPos = endMarkerPos - 1;
      const commandElem = cx.elt('inlineLatexCommand', startMathPos, contentStartPos - 1);
      const brace1Elem = cx.elt('inlineLatexBrace', contentStartPos - 1, contentStartPos);
      const brace2Elem = cx.elt('inlineLatexBrace', contentEndPos, endMarkerPos);
      const contentElem = cx.elt("inlineTextContent", contentStartPos, contentEndPos);
      return cx.addElement(cx.elt("inlineTextTypes", startMathPos, endMarkerPos, [
        commandElem, brace1Elem, contentElem, brace2Elem
      ]));
    }
  },
  {
    name: "inlineAuthor",
    after: 'InlineCode',
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const pickTag: RegExp = /\\(?:author)/;
      const match = src
        .match(pickTag);
      if (!match) {
        return -1;
      }
      let { res = false, nextPos = 0, content } = findEndMarker(src, match[0].length);
      if (!res) {
        return -1;
      }
      const endMarkerPos = startMathPos + nextPos;
      const contentStartPos = endMarkerPos - content.length - 1;
      const contentEndPos = endMarkerPos - 1;
      const commandElem = cx.elt('inlineLatexCommand', startMathPos, contentStartPos - 1);
      const brace1Elem = cx.elt('inlineLatexBrace', contentStartPos - 1, contentStartPos);
      const brace2Elem = cx.elt('inlineLatexBrace', contentEndPos, endMarkerPos);
      const contentElem = cx.elt("inlineTextContent", contentStartPos, contentEndPos);
      return cx.addElement(cx.elt("inlineAuthor", startMathPos, endMarkerPos, [
        commandElem, brace1Elem, contentElem, brace2Elem
      ]));
    }
  },
  {
    name: "inlineNewTheorem",
    after: "InlineCode",
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      let match = src
        .match(reNewTheoremNumbered);
      if (!match) {
        match = src
          .match(reNewTheoremNumbered2);
      }
      if (!match) {
        match = src
          .match(reNewTheorem);
      }
      if (!match) {
        match = src
          .match(reNewTheoremUnNumbered);
      }
      if (!match) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentElem = cx.elt("inlineLatexContent", startMathPos, endMarkerPos);
      return cx.addElement(cx.elt("inlineNewTheorem", startMathPos, endMarkerPos, [
        contentElem
      ]));
    }
  },
  {
    name: "inlineTheoremStyle",
    after: "InlineCode",
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const match = src
        .match(reTheoremStyle);
      if (!match) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentElem = cx.elt("inlineLatexContent", startMathPos, endMarkerPos);
      return cx.addElement(cx.elt("inlineTheoremStyle", startMathPos, endMarkerPos, [
        contentElem
      ]));
    }
  },
  {
    name: "inlineSetCounter",
    after: "InlineCode",
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const match = src
        .match(reSetCounter);
      if (!match) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentElem = cx.elt("inlineLatexContent", startMathPos, endMarkerPos);
      return cx.addElement(cx.elt("inlineSetCounter", startMathPos, endMarkerPos, [
        contentElem
      ]));
    }
  },
  {
    name: "inlineNewCommandQedSymbol",
    after: "InlineCode",
    parse(cx: InlineContext, next: number, pos: number): number {
      if (next !== 92 /* \ */) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      let startMathPos = pos;
      const match = src
        .match(reNewCommandQedSymbol);
      if (!match) {
        return -1;
      }
      const endMarkerPos = startMathPos + match[0].length;
      const contentElem = cx.elt("inlineLatexContent", startMathPos, endMarkerPos);
      return cx.addElement(cx.elt("inlineNewCommandQedSymbol", startMathPos, endMarkerPos, [
        contentElem
      ]));
    }
  }],
  wrap: wrappedTeXParser("inlineLatexContent")
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/inline-latex-footnotes.ts -----

import { MarkdownConfig, InlineContext } from "@lezer/markdown";
import {
  inlineMathTag,
  reLatexFootnotes,
  reNumber
} from "./consts";
import { wrappedTeXParser } from "./wrapped-TeXParser";
import { findEndMarker, isSpace } from "../helpers";

export const inlineLatexFootnotesConfig: MarkdownConfig = {
  defineNodes: [
    {
      name: "latexFootnotesContent",
      style: inlineMathTag
    },
    {
      name: 'latexFootnotes',
      style: inlineMathTag
    }
  ],
  parseInline: [
    {
      name: "latexFootnotes",
      after: "InlineCode",
      parse(cx: InlineContext, next: number, pos: number): number {
        if (next !== 92 /* \ */) {
          return -1;
        }
        const src = cx.text.slice(pos - cx.offset);
        if (!src) {
          return -1;
        }
        let startMathPos = pos;
        let nextPos: number = pos;
        let max: number = src.length;
        const match = src
          .match(reLatexFootnotes);
        if (!match) {
          return -1;
        }
        nextPos = match[0].length;
        for (; nextPos < max; nextPos++) {
          const code = src.charCodeAt(nextPos);
          if (!isSpace(code) && code !== 0x0A) { break; }
        }
        if (nextPos >= max) {
          if (nextPos === max && match[0] === "\\footnotemark") {
            const endMarkerPos = startMathPos + match[0].length;
            const contentElem = cx.elt("latexFootnotesContent", startMathPos, endMarkerPos);
            return cx.addElement(cx.elt("latexFootnotes", startMathPos, endMarkerPos, [
              contentElem
            ]));
          }
          return -1;
        }
        if (src.charCodeAt(nextPos) !== 123 /* { */
          && src.charCodeAt(nextPos) !== 0x5B/* [ */) {
          if (match[0] === "\\footnotemark") {
            const endMarkerPos = startMathPos + match[0].length;
            const contentElem = cx.elt("latexFootnotesContent", startMathPos, endMarkerPos);
            return cx.addElement(cx.elt("latexFootnotes", startMathPos, endMarkerPos, [
              contentElem
            ]));
          }
          return -1;
        }
        let data = null;
        let numbered = undefined;
        if (src.charCodeAt(nextPos) === 123 /* { */) {
          data = findEndMarker(src, nextPos);
        } else {
          data = null;
          let dataNumbered = findEndMarker(src, nextPos, "[", "]");
          if (!dataNumbered || !dataNumbered.res) {
            return -1; /** can not find end marker */
          }
          numbered = dataNumbered.content;
          if (numbered?.trim() && !reNumber.test(numbered)) {
            return -1;
          }
          nextPos = dataNumbered.nextPos;
          if (nextPos < max) {
            for (; nextPos < max; nextPos++) {
              const code = src.charCodeAt(nextPos);
              if (!isSpace(code) && code !== 0x0A) { break; }
            }
          }
          if (nextPos < max && src.charCodeAt(nextPos) === 123/* { */) {
            data = findEndMarker(src, nextPos);
            if (!data || !data.res) {
              return -1; /** can not find end marker */
            }
          } else {
            if (nextPos < max && match[0] === "\\footnotemark") {
              const endMarkerPos = startMathPos + dataNumbered.nextPos;
              const contentElem = cx.elt("latexFootnotesContent", startMathPos, endMarkerPos);
              return cx.addElement(cx.elt("latexFootnotes", startMathPos, endMarkerPos, [
                contentElem
              ]));
            }
          }
        }
        if (!data || !data.res) {
          return -1; /** can not find end marker */
        }
        const endMarkerPos = startMathPos + data.nextPos;
        const contentElem = cx.elt("latexFootnotesContent", startMathPos, endMarkerPos);
        return cx.addElement(cx.elt("latexFootnotes", startMathPos, endMarkerPos, [
          contentElem
        ]));
      }
    },
  ],
  wrap: wrappedTeXParser("latexFootnotesContent")
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/inline-math-config.ts -----
import { MarkdownConfig, InlineContext } from "@lezer/markdown";
import { wrappedTeXParser } from "./wrapped-TeXParser";
import {
  BACKSLASH_CHAR_CODE,
  DOLLAR_SIGN_CHAR_CODE,
  INLINE_MATH,
  INLINE_MATH_CONTENT_TAG,
  INLINE_MATH_START_DELIMITER,
  INLINE_MATH_STOP_DELIMITER,
  inlineMathTag,
  inlineMathTagDelimiter
} from "./consts";

/**
 *
 * parseInline - The parse function. Gets the next character and its position as arguments.
 * Should return -1 if it doesn't handle the character, or add some element or delimiter
 * and return the end position of the content it parsed if it can.
 * */
export const InlineMathConfig: MarkdownConfig = {
  defineNodes: [
    {
      name: INLINE_MATH,
      style: inlineMathTag,
    },
    {
      name: INLINE_MATH_CONTENT_TAG,
      style: inlineMathTag,
    },
    {
      name: INLINE_MATH_START_DELIMITER,
      style: inlineMathTagDelimiter,
    },
    {
      name: INLINE_MATH_STOP_DELIMITER,
      style: inlineMathTagDelimiter,
    },
  ],
  parseInline: [{
    name: INLINE_MATH,
    after: 'InlineCode',

    parse(cx: InlineContext, next: number, pos: number): number {
      const prevCharCode = pos - 1 >= 0 ? cx.char(pos - 1) : -1;
      const nextCharCode = cx.char(pos + 1);
      if (next !== DOLLAR_SIGN_CHAR_CODE
        || prevCharCode === DOLLAR_SIGN_CHAR_CODE
        || nextCharCode === DOLLAR_SIGN_CHAR_CODE) {
        return -1;
      }
      let escaped = false;
      const start = pos;
      const end = cx.end;
      pos++;
      for (; pos < end && (escaped || cx.char(pos) !== DOLLAR_SIGN_CHAR_CODE); pos++) {
        if (!escaped && cx.char(pos) === BACKSLASH_CHAR_CODE) {
          escaped = true;
        } else {
          escaped = false;
        }
      }
      pos++;
      const delimiterStartElem = cx.elt(INLINE_MATH_START_DELIMITER, start, start + 1);
      const contentElem = cx.elt(INLINE_MATH_CONTENT_TAG, start + 1, pos - 1);
      const delimiterStopElem = cx.elt(INLINE_MATH_STOP_DELIMITER, pos - 1, pos);
      const mathElement = cx.elt(INLINE_MATH, start, pos, [
        delimiterStartElem,
        contentElem,
        delimiterStopElem
      ]);
      return cx.addElement(mathElement);
    },
  }],
  wrap: wrappedTeXParser(INLINE_MATH_CONTENT_TAG)
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/inline-multiMath-config.ts -----

import { type MarkdownConfig, type InlineContext } from "@lezer/markdown";
import { wrappedTeXParser } from "./wrapped-TeXParser";
import {
  INLINE_MATH,
  INLINE_MULTI_MATH,
  INLINE_MULTI_MATH_CONTENT_TAG,
  INLINE_MULTI_MATH_START_DELIMITER,
  INLINE_MULTI_MATH_STOP_DELIMITER,
  inlineMathTagDelimiter,
  inlineMathTag,
  REFERENCE_NOTE,
  INLINE_DISPLAY_MATH
} from "./consts";

import {
  findOpenCloseTagsMathEnvironment,
  beginTag,
  endTag
} from "../helpers";

export const InlineMultiMathConfig: MarkdownConfig = {
  defineNodes: [
    { name: INLINE_MULTI_MATH, style: inlineMathTag },
    { name: INLINE_MULTI_MATH_CONTENT_TAG, style: inlineMathTag },
    { name: INLINE_MULTI_MATH_START_DELIMITER, style: inlineMathTagDelimiter },
    { name: INLINE_MULTI_MATH_STOP_DELIMITER, style: inlineMathTagDelimiter },
  ],
  parseInline: [{
    name: INLINE_MULTI_MATH,
    after: 'InlineCode',
    parse(cx: InlineContext, next: number, pos: number): number {
      const prevCharCode = pos - 1 >= 0 ? cx.char(pos - 1) : -1;
      const prevPrevCharCode = pos - 2 >= 0 ? cx.char(pos - 2) : -1;
      if ((prevPrevCharCode === 92) && (prevCharCode === 40 || prevCharCode === 91)) {
        pos = pos - 2;
        next = 92;
      }
      if (next !== 92) {
        return -1;
      }
      const src = cx.text.slice(pos - cx.offset);
      if (!src) {
        return -1;
      }
      
      const match = src.match(/^(?:\\\[|\[|\\\(|\(|\\begin\{([^}]*)\}|\\eqref\{([^}]*)\}|\\ref\{([^}]*)\})/);
      if (!match) {
        return -1;
      }

      let type: string = '';
      let endMarker: string = '';
      let endMarkerPos = -1;

      const matchIndex = match.index || 0;
      const startMathPos = matchIndex + match[0].length;
      
      if (match[0] === "\\\\[") {
        type = INLINE_DISPLAY_MATH;
        endMarker = "\\\\]";
      } else if (match[0] === "\\[") {
        type = INLINE_DISPLAY_MATH;
        endMarker = "\\]";
      } else if (match[0] === "\\\\(") {
        type = INLINE_MATH;
        endMarker = "\\\\)";
      } else if (match[0] === "\\(") {
        type = INLINE_MATH;
        endMarker = "\\)";
      } else if (match[0].includes("eqref")) {
        type = REFERENCE_NOTE;
        endMarker = "}"; // 💡 eqref도 닫는 괄호가 필요합니다.
      } else if (match[0].includes("ref")) {
        type = REFERENCE_NOTE;
        endMarker = "}"; // 💡 ref도 닫는 괄호가 필요합니다.
      } else if (match[1] && match[1] !== 'abstract') {
        if (match[1].indexOf('*') > 0) {
          type = "equation_math_not_number";
        } else {
          type = "equation_math";
        }
        endMarker = `\\end{${match[1]}}`;
        const environment = match[1].trim();
        const openTag: RegExp = beginTag(environment, true);
        const closeTag: RegExp = endTag(environment, true);
        const data = findOpenCloseTagsMathEnvironment(src, openTag, closeTag);
        
        if (data?.arrClose?.length) {
          const lastCloseTag = data.arrClose[data.arrClose.length - 1];
          if (lastCloseTag && typeof lastCloseTag.posStart === 'number') {
            endMarkerPos = lastCloseTag.posStart;
          }
        }
      }

      if (!type || !endMarker) {
        return -1;
      }

      if (endMarkerPos === -1) {
        endMarkerPos = src.indexOf(endMarker, startMathPos);
      }
      
      if (endMarkerPos === -1) {
        return -1;
      }

      const nextPos = endMarkerPos + endMarker.length;
      const absoluteEndPos = pos + nextPos; 

      if (type === REFERENCE_NOTE) {
        const closingBracePos = src.indexOf("}", startMathPos);
        if (closingBracePos === -1) return -1;
        const refEndPos = pos + closingBracePos + 1;
        
        const contentElem = cx.elt("inlineLatexContent", pos, refEndPos);
        return cx.addElement(cx.elt(REFERENCE_NOTE, pos, refEndPos, [
          contentElem
        ]));
      }

      const startDelimiterEnd = pos + match[0].length;
      const endDelimiterStart = pos + endMarkerPos;

      if (type === INLINE_MATH) {
        const delimiterStartElem = cx.elt(INLINE_MULTI_MATH_START_DELIMITER, pos, startDelimiterEnd);
        const contentElem = cx.elt(INLINE_MULTI_MATH_CONTENT_TAG, startDelimiterEnd, endDelimiterStart);
        const delimiterStopElem = cx.elt(INLINE_MULTI_MATH_STOP_DELIMITER, endDelimiterStart, absoluteEndPos);
        return cx.addElement(cx.elt(INLINE_MULTI_MATH, pos, absoluteEndPos, [
          delimiterStartElem,
          contentElem,
          delimiterStopElem
        ]));
      }

      const contentElem = cx.elt(INLINE_MULTI_MATH, pos, absoluteEndPos);
      return cx.addElement(
        cx.elt(INLINE_MULTI_MATH_CONTENT_TAG, pos, absoluteEndPos, [contentElem])
      );
    },
  }],
  wrap: wrappedTeXParser(INLINE_MULTI_MATH_CONTENT_TAG),
};
----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/markdown.ts -----

import { Tag, styleTags } from "@lezer/highlight";
export { markdownLanguage } from "@codemirror/lang-markdown";

export const tags = {
  codeinfo: Tag.define(),
  hardbreak: Tag.define(),
  taskmarker: Tag.define(),
};

export const markdownHighlight = {
  props: [
    styleTags({
      "CodeInfo": tags.codeinfo, // FencedCode 블록의 언어 이름 부분 (예: ```javascript)
      "HardBreak": tags.hardbreak, // 강제 줄바꿈
      "TaskMarker": tags.taskmarker, // - [x]
    })
  ],
};

----- ./react/shared/ui/codemirror-editor/codemirror-setup/markdown-parser/wrapped-TeXParser.ts -----
import { parseMixed, SyntaxNodeRef, Input } from "@lezer/common";
import {
  TEX_LANGUAGE,
  BLOCK_MULTI_MATH_CONTENT_TAG,
  BLOCK_MATH_CONTENT_TAG
} from "./consts";

/**
 * Wraps a TeX math-mode parser. This removes [nodeTag] from the syntax tree
 * and replaces it with a region handled by the sTeXMath parser.
 * */
export const wrappedTeXParser = (nodeTag: string) =>
  parseMixed((node: SyntaxNodeRef, input: Input) => {
    if (node.name !== nodeTag) return null;
    let overlay = undefined;
    if (nodeTag === BLOCK_MULTI_MATH_CONTENT_TAG || nodeTag === BLOCK_MATH_CONTENT_TAG) {
      const from = input.read(node.from, node.from + 1) === "\n" ? node.from + 1 : node.from;
      const to = input.read(node.to - 1, node.to) === "\n" ? node.to - 1 : node.to;
      if (from < to) {
        overlay = [{ from, to }];
      }
    }
    return {
      parser: TEX_LANGUAGE.parser,
      overlay
    };
  });
----- ./react/shared/ui/codemirror-editor/codemirror-setup/theme/index.ts -----

import { EditorView } from "@codemirror/view";

export const PADDING_TOP_CM_CONTENT = 18;

/** TODO: Add styling */
export const defaultLightThemeOption = EditorView.theme(
  {
    "&": {
      backgroundColor: "#FFFFFF",
    },
    ".ͼi": {
      color: "#4960FF",
    },
    ".ͼb": {
      color: "#DD3C71",
    },
    ".ͼc": {
      color: "#4960FF",
    },
    ".ͼk": {
      color: "#0093FF",
    },
    ".ͼd": {
      color: "#0093FF",
    },
    ".ͼe": {
      color: "#dd3c71",
    },
    ".ͼn": {
      color: "#4960FF",
    },
    ".ͼ5": {
      color: "#0093FF",
    },
    ".ͼ6": {
      color: "#0093FF",
    },
  },
  {
    dark: false,
  },
);

export const defaultDarkThemeOption = EditorView.theme(
  {
    "&": {
      backgroundColor: "#1E1E20",
    },
    ".ͼi": {
      color: "#8080FF",
    },
    ".ͼb": {
      color: "#F6558B",
    },
    ".ͼc": {
      color: "#8080FF",
    },
    ".ͼk": {
      color: "#47BCFF",
    },
    ".ͼd": {
      color: "#47BCFF",
    },
    ".ͼe": {
      color: "#F6558B",
    },
    ".ͼn": {
      color: "#8080FF",
    },
    ".ͼ5": {
      color: "#0093FF",
    },
    ".ͼ6": {
      color: "#8080FF",
    },
    ".cm-cursor": {
      borderLeftColor: "#47BCFF",
    },
  },
  {
    dark: true,
  },
);

export const defaultFocusThemeOption = EditorView.theme({
  "&.cm-editor": {
    "&.cm-focused": {
      outline: "none",
    },
  },
});

export const defaultGuttersThemeOption = EditorView.theme({
  ".cm-gutters": {
    backgroundColor: "transparent",
    borderRight: "none",
  },
  ".cm-gutter": {
    "&.cm-lineNumbers": {
      color: "#999",
      minWidth: "20px",
      textAlign: "right",
      whiteSpace: "nowrap",
      borderRight: "1px solid #ddd",
    },
    "&.cm-foldGutter": {},
  },
});

export const defaultActiveLineOption = EditorView.theme({
  ".cm-activeLineGutter": {
    backgroundColor: "var(--activeLineGutterBackground)",
  },
});

export const defaultFoldThemeOptions = EditorView.theme({
  ".cm-foldPlaceholder": {
    color: "var(--buttonPrimaryActive)",
    backgroundColor: "transparent",
    border: "none",
    borderRadius: "none",
    margin: "0",
    padding: "0",
    cursor: "pointer",
    "&:hover": {
      color: "var(--content-blue)",
    },
  },
});

export const defaultSelectionThemeOptions = EditorView.theme({
  ".cm-selectionBackground": {
    background: "var(--textHighlightColor)",
    color: "unset",
  },
  "&.cm-focused .cm-selectionBackground, ::selection": {
    background: "var(--textHighlightColor)",
    color: "unset",
  },
});

export const defaultInlineCodeThemeOptions = EditorView.theme({
  ".cm-inlineCode": {
    color: "var(--content-02)",
  },
});

export const defaultWidgetThemeOptions = EditorView.theme({
  ".widget-content": {
    fontFamily: "IBM Plex Sans",
    fontSize: "18px",
    visibility: "visible",
    position: "relative",
  },
  ".widget-content > img": {
    minWidth: "100%",
  },
});

/** Adds styles to the base theme */
export const defaultThemeOption = (
  cmContentPaddingTop: number = PADDING_TOP_CM_CONTENT,
  fontSize: string = "14px",
) => {
  return [
    defaultFocusThemeOption,
    defaultGuttersThemeOption,
    defaultActiveLineOption,
    defaultFoldThemeOptions,
    defaultSelectionThemeOptions,
    defaultInlineCodeThemeOptions,
    defaultWidgetThemeOptions,
    EditorView.theme({
      "&": {
        height: "100%",
        fontSize: `${fontSize}`,
        fontFamily: '"Roboto Mono", Helvetica, Arial, sans-serif',
      },
      ".cm-content": {
        paddingTop: `${cmContentPaddingTop}px`,
        paddingBottom: "calc(100vh - 91px)",
      },
      ".cm-scroller": {
        fontFamily: '"Roboto Mono", Helvetica, Arial, sans-serif',
        lineHeight: "23px",
        overflowY: "auto",
      },
      ".cm-line": {
        padding: "0 7px",
      },
    }),
  ] as const;
};
----- ./react/shared/ui/codemirror-editor/Editor.tsx -----
import React, { useRef, useEffect } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { basicSetup } from './codemirror-setup/basic-setup';
import configureMmdAutoCompleteForCodeMirror from './codemirror-setup/auto-complete/configure';
import './editor-style.scss';

interface EditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ initialContent = '', onContentChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  
  const onContentChangeRef = useRef(onContentChange);
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
  }, [onContentChange]);


  useEffect(() => {
    if (!editorRef.current) return;

    if (viewRef.current) return;
    
    const extensions = [
      basicSetup({
        lineNumbers: true,
        foldGutter: true,
        lineWrapping: true,
        darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
        onSave: () => {
          alert('Content saved!');
          console.log(viewRef.current?.state.doc.toString());
        },
      }),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onContentChangeRef.current?.(update.state.doc.toString());
        }
      })
    ];

    configureMmdAutoCompleteForCodeMirror(extensions);

    const startState = EditorState.create({
      doc: initialContent, // 초기값으로만 사용
      extensions: extensions,
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    
  }, []); 

  return <div ref={editorRef} className="editor-wrapper" />;
};

export default React.memo(Editor);
----- ./react/shared/ui/glasstable/GlassTable.tsx -----
import React, { forwardRef } from 'react';
import './GlassTable.css';
import { LuArrowDown, LuArrowUp } from 'react-icons/lu';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  width?: string;
  isSortable?: boolean;
  className?: string;
  dataLabel?: string;
}

interface GlassTableProps<T extends { id: string | number }> {
  columns: TableColumn<T>[];
  data: T[];
  caption?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
  scrollContainerProps?: React.HTMLAttributes<HTMLDivElement>;
}

function GlassTableInner<T extends { id: string | number }>(
  {
    columns,
    data,
    caption,
    isLoading = false,
    emptyMessage = "표시할 데이터가 없습니다.",
    sortConfig,
    onSort,
    scrollContainerProps,
  }: GlassTableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {

  const renderSortArrow = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' 
      ? <LuArrowUp className="sort-arrow" /> 
      : <LuArrowDown className="sort-arrow" />;
  };

  return (
    <div className="glass-table-wrapper">
      <div
        ref={ref}
        {...scrollContainerProps}
        className={`glass-table-scroll-container ${scrollContainerProps?.className || ''}`.trim()}
      >
        <table className="glass-table">
          {caption && <caption className="glass-table-caption">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width }}
                  className={`${col.isSortable ? 'sortable' : ''} ${col.className || ''}`.trim()}
                >
                  {/* [핵심 수정] 모든 th 내용을 .cell-content로 감쌈 */}
                  <div className="cell-content">
                    {col.isSortable && onSort ? (
                      <button type="button" onClick={() => onSort(String(col.key))} className="sort-header-button">
                        {col.header}
                        {renderSortArrow(String(col.key))}
                      </button>
                    ) : (
                      col.header
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={columns.length} className="loading-cell"><div className="spinner"></div><span>데이터를 불러오는 중...</span></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length} className="empty-cell">{emptyMessage}</td></tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  {columns.map((col, colIndex) => (
                    <td 
                      key={`${item.id}-${String(col.key)}-${colIndex}`} 
                      className={col.className || ''}
                      data-label={col.dataLabel} 
                    >
                      {/* [핵심 수정] 모든 td 내용을 .cell-content로 감쌈 */}
                      <div className="cell-content">
                        {col.render ? col.render(item) : String(item[col.key as keyof T] ?? '')}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const GlassTable = forwardRef(GlassTableInner) as <T extends { id: string | number }>(
  props: GlassTableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

export default GlassTable;
----- ./react/shared/ui/MathpixRenderer.tsx -----

import React, { useState, useEffect, useMemo } from 'react';

declare global {
  interface Window {
    markdownToHTML: (text: string, options?: object) => string;
    mathpixReady: Promise<boolean>;
    loadMathJax: () => boolean;
  }
}

interface MathpixRendererProps {
  text: string;
  options?: object;
}

const MathpixRenderer: React.FC<MathpixRendererProps> = ({ text, options = {} }) => {
  const [html, setHtml] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const memoizedOptions = useMemo(() => ({
    htmlTags: true,
    width: 800,
    ...options,
  }), [options]);

  useEffect(() => {
    let isCancelled = false;
    
    const initialize = async () => {
      try {
        await window.mathpixReady;
        if (isCancelled) return;
        
        if (typeof window.markdownToHTML === 'function') {
          setStatus('ready');
        } else {
          setStatus('error');
          console.error('[MathpixRenderer] Error: window.markdownToHTML function not found.');
        }
      } catch (err) {
        if (!isCancelled) {
          setStatus('error');
          console.error('[MathpixRenderer] Error: The mathpixReady Promise was rejected.', err);
        }
      }
    };
    
    initialize();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === 'ready') {
      try {
        const renderedHtml = window.markdownToHTML(text, memoizedOptions);
        setHtml(renderedHtml);
      } catch (err) {
        console.error("Markdown rendering error:", err);
        setHtml('<p style="color: red;">콘텐츠를 렌더링하는 중 오류가 발생했습니다.</p>');
      }
    }
  }, [status, text, memoizedOptions]);

  
  if (status === 'error') {
    return <p style={{ color: 'red' }}>미리보기 라이브러리를 로드할 수 없습니다.</p>;
  }

  if (status === 'loading') {
    return <p>미리보기 라이브러리 로딩 중...</p>;
  }

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default MathpixRenderer;
----- ./react/shared/ui/TableCellCheckbox/TableCellCheckbox.tsx -----
import React from 'react';
import { LuCircle, LuCircleCheckBig } from 'react-icons/lu';


interface CheckboxProps {
    /**
     * 체크박스의 현재 선택 상태. 이 값에 따라 아이콘이 변경됩니다.
     */
    isChecked: boolean;
    /**
     * 체크박스가 토글될 때 호출되는 함수입니다.
     * 상위 컴포넌트에서 이 함수를 통해 isChecked 상태를 업데이트해야 합니다.
     */
    onToggle: () => void;
    /**
     * 아이콘의 크기 (react-icons의 size prop).
     * @default 20
     */
    iconSize?: number;
    /**
     * 선택되었을 때 아이콘 색상 (CSS color 값, 예: '#3498db' 또는 'blue').
     * @default '#3498db'
     */
    checkedColor?: string;
    /**
     * 선택되지 않았을 때 아이콘 색상 (CSS color 값, 예: '#666' 또는 'gray').
     * @default '#ccc'
     */
    uncheckedColor?: string;
    /**
     * 체크박스를 비활성화할지 여부.
     * @default false
     */
    disabled?: boolean;
    /**
     * 최상위 요소(button)에 적용할 사용자 정의 CSS 클래스명.
     */
    className?: string;
    /**
     * 최상위 요소(button)에 직접 적용할 인라인 스타일 객체.
     */
    style?: React.CSSProperties;
    /**
     * 접근성을 위한 ARIA 레이블.
     * @default 'Checkbox'
     */
    ariaLabel?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
    isChecked,
    onToggle,
    iconSize = 20,
    checkedColor = '#3498db', // 기본 선택 색상
    uncheckedColor = '#ccc',   // 기본 미선택 색상
    disabled = false,
    className = '',
    style = {},
    ariaLabel = 'Checkbox', // 기본 ARIA 레이블 제공
}) => {
    const handleClick = () => {
        if (!disabled) {
            console.log(`[TableCellCheckbox] 클릭됨! onToggle 호출. 현재 isChecked: ${isChecked}`);
            onToggle(); // 외부로 상태 변경 요청 (상위에서 isChecked 상태를 업데이트해야 함)
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!disabled && (event.key === ' ' || event.key === 'Enter')) {
            event.preventDefault(); // 기본 동작(예: 스페이스바로 페이지 스크롤) 방지
            onToggle();
        }
    };

    const currentIconColor = isChecked ? checkedColor : uncheckedColor;

    const buttonClassName = `
    checkbox-component ${/* 이 컴포넌트 전체를 위한 기본 식별 클래스 (선택 사항) */''}
    ${disabled ? 'checkbox-disabled' : 'checkbox-enabled'} ${/* CSS에서 스타일링하기 위한 활성/비활성 클래스 */''}
    ${className} ${/* 사용자가 전달한 추가 클래스 */''}
  `.trim().replace(/\s+/g, ' '); // 여분의 공백 정리

    const buttonStyle: React.CSSProperties = {
        background: 'none', // 버튼 기본 배경 제거
        border: 'none',     // 버튼 기본 테두리 제거
        padding: 0,         // 버튼 기본 패딩 제거
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', // 아이콘 정렬 및 크기 조정을 위해
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1, // 비활성화 시 투명도 조절
        ...style, // 사용자가 전달한 스타일로 덮어쓰기 가능
    };

    return (
        <button
            type="button" // 폼 내부에서 기본 제출 동작 방지
            onClick={handleClick}
            onKeyDown={handleKeyDown} // 스페이스바, 엔터키로 토글 지원
            disabled={disabled}
            className={buttonClassName}
            style={buttonStyle}
            role="checkbox"
            aria-checked={isChecked}
            aria-label={ariaLabel}
        >
            {isChecked ? (
                <LuCircleCheckBig size={iconSize} color={currentIconColor} aria-hidden="true" />
            ) : (
                <LuCircle size={iconSize} color={currentIconColor} aria-hidden="true" />
            )}
            {/* 스크린 리더 사용자를 위해 숨겨진 텍스트 추가 (선택 사항, aria-label로 충분할 수도 있음) */}
            {/* <span className="sr-only">{isChecked ? 'Selected' : 'Not selected'}</span> */}
        </button>
    );
};

export default Checkbox;
----- ./react/widgets/rootlayout/BackgroundBlobs.tsx -----
import './BackgroundBlobs.css'; // 오타 수정: BackgroundBolbs.css -> BackgroundBlobs.css

const BackgroundBlobs = () => {
    return (
        <div className="blobs-container">
            <div className="blob-item blob-1"></div>
            <div className="blob-item blob-2"></div>
            <div className="blob-item blob-3"></div>
            <div className="blob-item blob-4"></div>
        </div>
    );
};

export default BackgroundBlobs;
----- ./react/widgets/rootlayout/GlassNavbar.tsx -----
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router'; // useLocation import
import './GlassNavbar.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectSidebarTriggers } from '../../shared/store/layoutStore';
import { LuLayoutDashboard, LuMenu, LuCircleUserRound, LuCirclePlus, LuSettings2 } from 'react-icons/lu';
import Tippy from '@tippyjs/react';

import GlassPopover from '../../shared/components/GlassPopover';
import ProfileMenuContent from '../../features/popovermenu/ProfileMenuContent';

const LogoIcon = () => <LuLayoutDashboard size={26} className="navbar-logo-icon" />;
const HamburgerIcon = () => <LuMenu size={22} />;
const ProfileIcon = () => <LuCircleUserRound size={22} />;
const RegisterIcon = () => <LuCirclePlus size={22} />;
const SettingsIcon = () => <LuSettings2 size={22} />;

const GlassNavbar: React.FC = () => {
    const location = useLocation(); // [추가]
    const {
        currentBreakpoint,
        toggleLeftSidebar,
        mobileSidebarType,
        closeMobileSidebar,
    } = useUIStore();
    
    const { onRegisterClick, onSettingsClick } = useLayoutStore(selectSidebarTriggers);

    const [isProfilePopoverOpen, setIsProfilePopoverOpen] = useState(false);
    const profileButtonRef = useRef<HTMLButtonElement>(null);
    
    const isDashboardPage = location.pathname.startsWith('/dashboard');

    const handleProfileButtonClick = () => {
        if (currentBreakpoint === 'mobile' && mobileSidebarType && !isProfilePopoverOpen) {
            closeMobileSidebar();
        }
        setIsProfilePopoverOpen(prev => !prev);
    };

    const handleCloseProfilePopover = () => {
        setIsProfilePopoverOpen(false);
    };

    useEffect(() => {
        if (isProfilePopoverOpen) {
            handleCloseProfilePopover();
        }
    }, [currentBreakpoint]);

    return (
        <nav className="glass-navbar">
            <div className="navbar-left">
                {currentBreakpoint === 'mobile' && (
                    <Tippy content="메뉴" placement="bottom-start" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                        <button
                            className={`navbar-icon-button hamburger-button ${isProfilePopoverOpen && currentBreakpoint === 'mobile' ? '' : (mobileSidebarType === 'left' ? 'active' : '')}`}
                            onClick={toggleLeftSidebar}
                            aria-label="메인 메뉴"
                            aria-expanded={mobileSidebarType === 'left'}
                        >
                            <HamburgerIcon />
                        </button>
                    </Tippy>
                )}
                <Link to="/dashboard" className="navbar-logo-link" aria-label="대시보드로 이동">
                    <LogoIcon />
                </Link>
            </div>

            <div className="navbar-right">
                {currentBreakpoint === 'mobile' && (
                    <div className="mobile-right-actions">
                        {onRegisterClick && (
                            <Tippy content="신입생 등록" placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={onRegisterClick} className="navbar-icon-button" aria-label="신입생 등록">
                                    <RegisterIcon />
                                </button>
                            </Tippy>
                        )}
                        {/* [수정] 대시보드 페이지이고, onSettingsClick 함수가 있을 때만 버튼 렌더링 */}
                        {isDashboardPage && onSettingsClick && (
                             <Tippy content="테이블 설정" placement="bottom" theme="custom-glass" delay={[300, 0]}>
                                <button onClick={onSettingsClick} className="navbar-icon-button" aria-label="테이블 설정">
                                    <SettingsIcon />
                                </button>
                            </Tippy>
                        )}
                    </div>
                )}

                <button
                    ref={profileButtonRef}
                    className={`profile-button navbar-icon-button ${isProfilePopoverOpen ? 'active' : ''}`}
                    aria-label="프로필 메뉴 열기/닫기"
                    onClick={handleProfileButtonClick}
                    aria-expanded={isProfilePopoverOpen}
                >
                    <ProfileIcon />
                </button>

                <GlassPopover
                    isOpen={isProfilePopoverOpen}
                    onClose={handleCloseProfilePopover}
                    anchorEl={profileButtonRef.current}
                    placement="bottom-end"
                    offsetY={10}
                >
                    <ProfileMenuContent onClose={handleCloseProfilePopover} />
                </GlassPopover>
            </div>
        </nav>
    );
};

export default GlassNavbar;
----- ./react/widgets/rootlayout/GlassSidebar.tsx -----
import React from 'react';
import { NavLink } from 'react-router'; 
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // Tippy 기본 스타일 (필요시)
import 'tippy.js/themes/light.css'; // Tippy 테마 (필요시, custom-glass 테마 CSS가 있다면 불필요할 수 있음)
import 'tippy.js/animations/perspective.css'; // Tippy 애니메이션 (필요시)

import './GlassSidebar.css';
import { useUIStore } from '../../shared/store/uiStore'; // UI 상태 관리 스토어 import 경로 확인
import {
    LuLayoutDashboard, LuCheck, LuLibrary, LuHeart, LuActivity,
    LuChartBar, LuFileText, LuChevronLeft, LuChevronRight,
    LuTestTubes, LuMove, LuFile // 추가 아이콘
} from 'react-icons/lu';

interface MenuItemData {
    path: string;
    name: string;
    icon: React.ReactNode;
    isSubItem?: boolean;
    badge?: number;
}

const DashboardIcon = () => <LuLayoutDashboard size={18} />;
const ProblemIcon = () => <LuFile size={18} />;
const ExampleIcon = () => <LuTestTubes size={18} />; 
const MoveIcon = () => <LuMove size={18} />; 
const ActivityIcon = () => <LuActivity size={18} />;
const StatisticIcon = () => <LuChartBar size={18} />;
const PerformanceIcon = () => <LuFileText size={18} />;
const TasksIcon = () => <LuCheck size={18} />;
const LibrariesIcon = () => <LuLibrary size={18} />;
const SavedIcon = () => <LuHeart size={18} />;
const CloseLeftSidebarIcon = () => <LuChevronLeft size={22} />;
const TabletToggleChevronLeftIcon = () => <LuChevronLeft size={20} />;
const TabletToggleChevronRightIcon = () => <LuChevronRight size={20} />;

export const allMenuItems: MenuItemData[] = [
     { 
        path: '/dashboard', // 현재 App.tsx 구조상 대시보드 경로는 /dashboard 입니다.
        name: '대시보드', 
        icon: <DashboardIcon /> 
    },
    {
        path: '/problem-workbench', // 새 페이지의 URL 경로
        name: '문제 작업',
        icon: <ProblemIcon />
    },
   
     { 
        path: '/exampleget', 
        name: 'DB 예제', 
        icon: <ExampleIcon /> 
    },
];


const GlassSidebar: React.FC = () => {
    const { isLeftSidebarExpanded, mobileSidebarType, currentBreakpoint, toggleLeftSidebar, closeMobileSidebar } = useUIStore();

    let sidebarShouldBeCollapsed = false;
    let isVisibleOnScreen = true;

    if (currentBreakpoint === 'mobile') {
        isVisibleOnScreen = mobileSidebarType === 'left';
        sidebarShouldBeCollapsed = false; // 모바일에서는 항상 확장된 형태
    } else if (currentBreakpoint === 'tablet') {
        sidebarShouldBeCollapsed = !isLeftSidebarExpanded;
    } else { // desktop
        sidebarShouldBeCollapsed = !isLeftSidebarExpanded;
    }

    const handleLinkClick = () => {
        if (currentBreakpoint === 'mobile') {
            closeMobileSidebar();
        }
    };
    

    return (
        <aside className={`glass-sidebar
            ${sidebarShouldBeCollapsed ? 'collapsed' : ''}
            ${currentBreakpoint === 'mobile' ? 'mobile-sidebar left-mobile-sidebar' : ''}
            ${currentBreakpoint === 'mobile' && isVisibleOnScreen ? 'open' : ''}
        `}>
         
            <div className="sidebar-header lgs-header">
                {currentBreakpoint === 'mobile' && (
                    <>
                        <span className="sidebar-header-text">메뉴</span>
                        <Tippy content="닫기" placement="bottom" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                            <button onClick={closeMobileSidebar} className="sidebar-close-button mobile-only lgs-close-btn" aria-label="메뉴 닫기">
                                <CloseLeftSidebarIcon />
                            </button>
                        </Tippy>
                    </>
                )}
                 {/* 데스크탑/태블릿 헤더 */}
                {currentBreakpoint !== 'mobile' && (
                    <>
                        {/* 접힌 상태가 아닐 때만 텍스트 표시 */}
                        {(!sidebarShouldBeCollapsed) && <span className="sidebar-header-text">MAIN</span>}
                    </>
                )}
            </div>

            {/* 태블릿 전용 토글 버튼 */}
            {currentBreakpoint === 'tablet' && (
                <div className="tablet-toggle-button-wrapper">
                    <Tippy content={isLeftSidebarExpanded ? "메뉴 축소" : "메뉴 확장"} placement="right" theme="custom-glass" animation="perspective" delay={[200, 0]}>
                        <button
                            onClick={toggleLeftSidebar}
                            className="sidebar-toggle-button left-sidebar-toggle tablet-control"
                            aria-label={isLeftSidebarExpanded ? "메뉴 축소" : "메뉴 확장"}
                        >
                            {isLeftSidebarExpanded ? <TabletToggleChevronLeftIcon /> : <TabletToggleChevronRightIcon />}
                        </button>
                    </Tippy>
                </div>
            )}

            <nav className="sidebar-nav lgs-nav">
                <ul>
                    {/* 수정된 allMenuItems 배열을 순회 */}
                    {allMenuItems.map((item) => {
                        const isMobileView = currentBreakpoint === 'mobile';
                        const showFullText = (!sidebarShouldBeCollapsed || isMobileView);
                        const itemAriaLabel = `${item.name}${item.badge ? `, 알림 ${item.badge}개` : ''}`;

                        return (
                            <li key={item.path} className={`${item.isSubItem ? 'sub-menu-item-li' : ''} ${(sidebarShouldBeCollapsed && !isMobileView) ? 'li-collapsed' : ''}`}>
                                {/* 텍스트가 보일 때는 툴팁 비활성화 */}
                                <Tippy
                                    content={item.name}
                                    placement="right"
                                    theme="custom-glass" // CSS에 .tippy-box[data-theme~='custom-glass'] 정의 필요
                                    animation="perspective"
                                    delay={[350, 0]}
                                    disabled={showFullText} 
                                >
                                    <NavLink
                                        to={item.path}
                                        className={({ isActive }) => 
                                            `menu-item-link 
                                            ${isActive ? 'active' : ''} 
                                            ${item.isSubItem ? 'sub-menu-item-link' : ''} 
                                            ${(sidebarShouldBeCollapsed && !isMobileView) ? 'link-collapsed' : ''}`
                                        }
                                        onClick={handleLinkClick}
                                        aria-label={itemAriaLabel}
                                    >
                                        <span className="menu-icon-wrapper">{item.icon}</span>
                                        {/* 텍스트와 뱃지는 showFullText 조건일 때만 표시 */}
                                        {showFullText && <span className="menu-item-name">{item.name}</span>}
                                        {showFullText && item.badge && (
                                            <span className="notification-badge" aria-label={`알림 ${item.badge}개`}>{item.badge}</span>
                                        )}
                                    </NavLink>
                                </Tippy>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
};
export default GlassSidebar;
----- ./react/widgets/rootlayout/GlassSidebarRight.tsx -----
import React from 'react';
import { useLocation } from 'react-router';
import Tippy from '@tippyjs/react';
import './GlassSidebarRight.css';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectRightSidebarContent, selectSidebarTriggers } from '../../shared/store/layoutStore';
import { LuSettings2, LuChevronRight, LuCircleX, LuCirclePlus } from 'react-icons/lu';

const SettingsIcon = () => <LuSettings2 size={20} />;
const CloseRightSidebarIcon = () => <LuChevronRight size={22} />;
const CloseIcon = () => <LuCircleX size={22} />;
const PlusIcon = () => <LuCirclePlus size={22} />;

const GlassSidebarRight: React.FC = () => {
    const location = useLocation();
    const rightSidebarContent = useLayoutStore(selectRightSidebarContent);
    const { onRegisterClick, onSettingsClick, onClose } = useLayoutStore(selectSidebarTriggers);
    
    const { isRightSidebarExpanded, mobileSidebarType, currentBreakpoint } = useUIStore();
    
    const isDashboardPage = location.pathname.startsWith('/dashboard');

    const isOpen = currentBreakpoint === 'mobile' ? mobileSidebarType === 'right' : isRightSidebarExpanded;

    return (
        <aside className={`glass-sidebar-right ${isOpen ? 'expanded' : ''} ${currentBreakpoint === 'mobile' ? 'mobile-sidebar right-mobile-sidebar' : ''} ${isOpen ? 'open' : ''}`}>
            {currentBreakpoint !== 'mobile' && (
                <div className="rgs-header-desktop">
                    {isRightSidebarExpanded ? (
                        <Tippy content="닫기" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                            <button onClick={onClose} className="settings-toggle-button active" aria-label="사이드바 닫기">
                                <CloseIcon />
                            </button>
                        </Tippy>
                    ) : (
                        <>
                            <Tippy content="신입생 등록" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                <button onClick={onRegisterClick} className="settings-toggle-button" aria-label="신입생 등록">
                                    <PlusIcon />
                                </button>
                            </Tippy>
                            
                            {isDashboardPage && (
                                <Tippy content="테이블 설정" placement="left" theme="custom-glass" animation="perspective" delay={[300, 0]}>
                                    <button
                                        onClick={onSettingsClick}
                                        className="settings-toggle-button"
                                        aria-label="테이블 컬럼 설정"
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
                                {/* [수정] onClick 핸들러를 uiStore의 closeMobileSidebar 직접 호출에서 layoutStore의 onClose 트리거로 변경 */}
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
----- ./react/widgets/rootlayout/RootLayout.tsx -----
import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useUIStore } from '../../shared/store/uiStore';
import { useLayoutStore, selectStudentSearchProps } from '../../shared/store/layoutStore';
import BackgroundBlobs from '../rootlayout/BackgroundBlobs';
import GlassNavbar from '../rootlayout/GlassNavbar';
import GlassSidebar from '../rootlayout/GlassSidebar';
import GlassSidebarRight from '../rootlayout/GlassSidebarRight';
import TableSearch from '../../features/table-search/ui/TableSearch';
import './RootLayout.css';

const RootLayout = () => {
    const location = useLocation();
    const { 
        currentBreakpoint, 
        mobileSidebarType, 
        closeMobileSidebar, 
        isLeftSidebarExpanded, 
        isRightSidebarExpanded 
    } = useUIStore();
    const studentSearchProps = useLayoutStore(selectStudentSearchProps);

    const parsedSuggestionGroups = useMemo(() => {
        if (studentSearchProps?.suggestionGroups) {
            try {
                return JSON.parse(studentSearchProps.suggestionGroups);
            } catch (e) {
                console.error("Failed to parse suggestionGroups JSON", e);
                return [];
            }
        }
        return [];
    }, [studentSearchProps?.suggestionGroups]);

    const showOverlay = currentBreakpoint === 'mobile' && mobileSidebarType !== null;
    
    const sidebarStateClass = `
        ${isLeftSidebarExpanded ? 'left-sidebar-expanded' : 'left-sidebar-collapsed'}
        ${isRightSidebarExpanded ? 'right-sidebar-expanded' : 'right-sidebar-collapsed'}
    `.trim();

    const isWorkbenchPage = location.pathname === '/problem-workbench';
    const mainContentClasses = `main-content ${isWorkbenchPage ? 'main-content--compact-padding' : ''}`;

    return (
        <div className={`app-container ${sidebarStateClass} ${showOverlay ? 'mobile-sidebar-active' : ''}`}>
            <div className="background-blobs-wrapper"><BackgroundBlobs /></div>
            
            {/* 
              [핵심 수정] 
              오버레이를 layout-main-wrapper 안으로 이동시킵니다.
              이렇게 하면 오버레이가 사이드바(z-index: 110) 아래, 메인 콘텐츠(z-index: 5) 위에 위치하게 되어
              사이드바는 블러 처리되지 않고 메인 콘텐츠만 블러 처리됩니다.
            */}
            
            {currentBreakpoint === 'mobile' && <GlassSidebar />}
            {currentBreakpoint === 'mobile' && <GlassSidebarRight />}
            
            <div className={`layout-main-wrapper ${currentBreakpoint}-layout`}>
                {showOverlay && (<div className={`clickable-overlay active`} onClick={closeMobileSidebar} aria-hidden="true" />)}
                <GlassNavbar />
                <div className="content-body-wrapper">
                    {currentBreakpoint !== 'mobile' && <GlassSidebar />}
                    
                    <main className={mainContentClasses}>
                        <Outlet />
                    </main>

                    {currentBreakpoint !== 'mobile' && <GlassSidebarRight />}
                </div>

                {studentSearchProps && (
                    <div className="bottom-content-area">
                        <TableSearch
                            {...studentSearchProps}
                            suggestionGroups={parsedSuggestionGroups}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default RootLayout;
----- ./react/widgets/student-table/StudentTableWidget.tsx -----
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import StudentDisplay from '../../entities/student/ui/StudentDisplay';
import { useStudentDataWithRQ, type Student, GRADE_LEVELS } from '../../entities/student/model/useStudentDataWithRQ';
import type { SortConfig } from '../../shared/ui/glasstable/GlassTable';
import { useDragToScroll } from '../../shared/hooks/useDragToScroll';

type StatusValue = Student['status'];

const statusOrder: { [key in StatusValue]: number } = {
    '재원': 1, '휴원': 2, '퇴원': 3,
};

interface StudentTableWidgetProps {
    students: Student[];
    isLoading: boolean;
    onRequestEdit: (student: Student) => void;
    selectedIds: Set<string>;
    toggleRow: (id: string) => void;
    isAllSelected: boolean;
    toggleSelectAll: () => void;
}

const StudentTableWidget: React.FC<StudentTableWidgetProps> = ({ 
    students = [], 
    isLoading, 
    onRequestEdit,
    selectedIds,
    toggleRow,
    isAllSelected,
    toggleSelectAll
}) => {
    const { ref: scrollContainerRef, onMouseDown, isDragging } = useDragToScroll<HTMLDivElement>();
    const navigate = useNavigate();
    const { updateStudent, deleteStudent } = useStudentDataWithRQ();

    const [editingStatusRowId, setEditingStatusRowId] = useState<string | null>(null);
    const [activeCardId, setActiveCardId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: 'student_name', direction: 'asc' });

    const sortedStudents = useMemo(() => {
        return [...students].sort((a, b) => {
            const statusComparison = statusOrder[a.status] - statusOrder[b.status];
            if (statusComparison !== 0) {
                return statusComparison;
            }

            if (!sortConfig) return 0;
            
            if (sortConfig.key === 'grade') {
                const aRank = GRADE_LEVELS.indexOf(a.grade);
                const bRank = GRADE_LEVELS.indexOf(b.grade);
                const aFinalRank = aRank === -1 ? Infinity : aRank;
                const bFinalRank = bRank === -1 ? Infinity : bRank;
                const comparison = aFinalRank - bFinalRank;
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            }

            const key = sortConfig.key as keyof Student;
            const aValue = a[key];
            const bValue = b[key];
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            const comparison = typeof aValue === 'number' && typeof bValue === 'number'
                ? aValue - bValue
                : String(aValue).localeCompare(String(bValue));

            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [students, sortConfig]);

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: (current && current.key === key && current.direction === 'asc') ? 'desc' : 'asc'
        }));
    };
    
    const handleNavigate = (studentId: string) => {
        setEditingStatusRowId(null);
        navigate(`/student/${studentId}`);
    };

    const handleToggleStatusEditor = (studentId: string) => {
        setEditingStatusRowId(prevId => (prevId === studentId ? null : studentId));
    };

    const handleStatusUpdate = async (studentId: string, newStatus: StatusValue | 'delete') => {
        try {
            if (newStatus === 'delete') {
                if (window.confirm("정말로 이 학생 정보를 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                    await deleteStudent(studentId);
                }
            } else {
                await updateStudent({ id: studentId, status: newStatus });
            }
        } catch (error) {
            console.error("상태 업데이트 또는 삭제 중 오류 발생:", error);
        } finally {
            setEditingStatusRowId(null);
            setActiveCardId(null);
        }
    };

    const handleCancelStatusEdit = () => {
        setEditingStatusRowId(null);
    };

    const handleCardClick = (studentId: string) => {
        if (editingStatusRowId !== null) return;
        
        setActiveCardId(prevId => (prevId === studentId ? null : studentId));
    };
    
    const closeActiveCard = () => {
        setActiveCardId(null);
    };

    return (
        <StudentDisplay
            ref={scrollContainerRef}
            scrollContainerProps={{
                onMouseDown: onMouseDown,
                className: isDragging ? 'dragging' : '',
            }}
            students={sortedStudents}
            isLoading={isLoading}
            sortConfig={sortConfig}
            onSort={handleSort}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            isHeaderChecked={isAllSelected}
            onToggleHeader={toggleSelectAll}
            isHeaderDisabled={students.length === 0}
            editingStatusRowId={editingStatusRowId}
            onEdit={onRequestEdit} 
            onNavigate={handleNavigate}
            onToggleStatusEditor={handleToggleStatusEditor}
            onStatusUpdate={handleStatusUpdate}
            onCancel={handleCancelStatusEdit}
            activeCardId={activeCardId}
            onCardClick={handleCardClick}
            closeActiveCard={closeActiveCard}
        />
    );
};

export default StudentTableWidget;
----- ./react/widgets/UserDetailsButton.tsx -----
import React, { useState } from "react";
import {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectIsLoadingAuth,
  selectAuthError, // API 호출이 없으므로 이 에러는 직접 관련 없을 수 있지만, 참고용으로 추가
} from "../shared/store/authStore";

export const UserDetailsButton: React.FC = () => {
  const user = useAuthStore(selectUser);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoadingAuth = useAuthStore(selectIsLoadingAuth);

  const [userDetailsString, setUserDetailsString] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null); // 이 컴포넌트 내 작업 관련 에러

  const handleShowDetails = () => {
    setLocalError(null); // 이전 에러 클리어
    setUserDetailsString(null); // 이전 상세정보 클리어

    if (isLoadingAuth) {
      setLocalError("아직 인증 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!isAuthenticated || !user) {
      setLocalError("사용자 정보를 표시하려면 먼저 로그인해야 합니다.");
      return;
    }

    try {
      const displayUserInfo = {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
        created_at: user.created_at,
      };
      setUserDetailsString(JSON.stringify(displayUserInfo, null, 2));
    } catch (e: any) {
      console.error("Error processing user details:", e);
      setLocalError("사용자 정보를 처리하는 중 오류가 발생했습니다.");
    }
  };

  /*
  const { honoClient } = await import("../shared/api/honoClient"); // 동적 import 예시

  const handleFetchDetailsFromApi = async () => {
    setLocalError(null);
    setUserDetailsString(null);

    if (isLoadingAuth) {
      setLocalError("아직 인증 정보를 확인 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!isAuthenticated) {
      setLocalError("API를 호출하려면 먼저 로그인해야 합니다.");
      return;
    }

    try {
      const res = await honoClient.user.$get(); // honoClient import 필요

      if (!res.ok) {
        let errorMsg = `Error: ${res.status} ${res.statusText}`;
        try {
          const errData = await res.json();
          if (typeof errData === "object" && errData !== null) {
            if ("error" in errData && typeof errData.error === "string") errorMsg = errData.error;
            else if ("message" in errData && typeof errData.message === "string") errorMsg = errData.message;
          }
        } catch (e) {  } // json parsing 실패 무시
        throw new Error(errorMsg);
      }
      const data = await res.json();
      setUserDetailsString(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error("Error fetching user details from API:", err);
      setLocalError(err.message || "API에서 사용자 정보를 가져오는 데 실패했습니다.");
    } finally {
    }
  };
  */

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '4px' }}>
      <h3 style={{ marginTop: '0' }}>내 사용자 정보 확인</h3>
      <button
        type="button"
        onClick={handleShowDetails} // API 호출이 필요하면 handleFetchDetailsFromApi로 변경
        disabled={isLoadingAuth} // API 호출 시에는 isFetchingApi도 고려
        style={{ padding: '8px 12px', marginBottom: '10px' }}
      >
        {isLoadingAuth ? '인증 확인 중...' : '내 정보 보기 (Store)'}
        {/* API 호출 시: {isFetchingApi ? '정보 가져오는 중...' : '내 정보 보기 (API)'} */}
      </button>

      {localError && <p style={{ color: "red" }}>{localError}</p>}
      {/* authStoreError도 필요하다면 여기에 표시할 수 있습니다. */}
      {/* authStoreError && <p style={{ color: "orange" }}>인증 시스템 에러: {authStoreError}</p> */}

      {userDetailsString && (
        <pre style={{ background: '#f7f7f7', padding: '10px', borderRadius: '4px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {userDetailsString}
        </pre>
      )}
      {!userDetailsString && !localError && !isLoadingAuth && isAuthenticated && (
        <p>버튼을 클릭하여 사용자 정보를 확인하세요.</p>
      )}
      {!isAuthenticated && !isLoadingAuth && (
        <p>로그인 후 사용자 정보를 확인할 수 있습니다.</p>
      )}
    </div>
  );
};

