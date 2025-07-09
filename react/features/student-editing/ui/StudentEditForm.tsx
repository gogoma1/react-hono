import React, { useState, useEffect, useMemo } from 'react';
import { 
    GRADE_LEVELS, 
    type Student, 
    type UpdateStudentInput,
    type MemberDetails
} from '../../../entities/student/model/types';
import CategoryInput from '../../student-registration/ui/CategoryInput';
import '../../student-registration/ui/StudentRegistrationForm.css';
import type { StaffMember } from '../../../entities/staff/model/types';

// 로컬 컴포넌트 정의
interface ManagerCategoryInputProps {
    label: string;
    suggestions: { id: string, name: string }[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    isLoading?: boolean;
}

const ManagerCategoryInput: React.FC<ManagerCategoryInputProps> = ({
    label,
    suggestions,
    selectedIds,
    onToggle,
    isLoading,
}) => {
    return (
        <div className="category-input-group">
            <label className="form-label">{label}</label>
            <div className="category-suggestions">
                {isLoading ? (
                    <span className="loading-text">강사 목록 로딩 중...</span>
                ) : (
                    suggestions.map((suggestion) => (
                        <button
                            type="button"
                            key={suggestion.id}
                            className={`suggestion-button ${selectedIds.has(suggestion.id) ? 'active' : ''}`}
                            onClick={() => onToggle(suggestion.id)}
                        >
                            {suggestion.name}
                        </button>
                    ))
                )}
                 { !isLoading && suggestions.length === 0 && <span className="no-suggestion-text">등록된 강사가 없습니다.</span>}
            </div>
        </div>
    );
};

// 메인 컴포넌트 Props 정의
interface StudentEditFormProps {
    student: Student;
    onSuccess: () => void;
    updateStudent: (data: UpdateStudentInput) => Promise<any>; 
    updateStudentStatus: { isPending: boolean; isError: boolean; error: Error | null; data?: any; };
    allStudents: Student[];
    allTeachers: StaffMember[];
    isLoadingStaff: boolean;
}

const getUniqueValuesFromDetails = (students: Student[], key: keyof MemberDetails): (string | number)[] => {
    if (!students || students.length === 0) return [];
    
    const values = students
        .map(student => student.details?.[key])
        .filter((value): value is string | number => value !== null && value !== undefined && String(value).trim() !== '');
        
    const uniqueValues = Array.from(new Set(values));
    if (uniqueValues.length > 0 && typeof uniqueValues[0] === 'number') {
        return uniqueValues.sort((a, b) => (a as number) - (b as number));
    }
    return uniqueValues.sort();
};

const StudentEditForm: React.FC<StudentEditFormProps> = ({
    student,
    onSuccess,
    updateStudent,
    updateStudentStatus,
    allStudents,
    allTeachers,
    isLoadingStaff,
}) => {
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [className, setClassName] = useState('');
    const [subject, setSubject] = useState('');
    const [status, setStatus] = useState<Student['status']>('active');
    const [studentPhone, setStudentPhone] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tuition, setTuition] = useState('');
    const [selectedManagerIds, setSelectedManagerIds] = useState<Set<string>>(new Set());
    
    const uniqueClassNames = useMemo(() => getUniqueValuesFromDetails(allStudents, 'class_name'), [allStudents]);
    const uniqueSubjects = useMemo(() => getUniqueValuesFromDetails(allStudents, 'subject'), [allStudents]);
    const uniqueSchoolNames = useMemo(() => getUniqueValuesFromDetails(allStudents, 'school_name'), [allStudents]);

    useEffect(() => {
        if (student) {
            setName(student.details?.student_name || '');
            setGrade(student.details?.grade || '');
            setClassName(student.details?.class_name || '');
            setSubject(student.details?.subject || '');
            setStatus(student.status);
            setStudentPhone(student.details?.student_phone || '');
            setGuardianPhone(student.details?.guardian_phone || '');
            setSchoolName(student.details?.school_name || '');
            setTuition(String(student.details?.tuition || ''));
            const initialManagerIds = new Set(student.managers?.map(m => m.id).filter(Boolean) || []);
            setSelectedManagerIds(initialManagerIds);
        }
    }, [student]);

    useEffect(() => {
        // isSuccess 플래그 대신 data 존재 여부로 성공을 판별하여 무한 루프 가능성을 줄입니다.
        if (!updateStudentStatus.isPending && !updateStudentStatus.isError && updateStudentStatus.data) {
            onSuccess();
        }
    }, [updateStudentStatus, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const updatedData: UpdateStudentInput = {
            id: student.id,
            status: status,
            details: {
                student_name: name.trim(),
                grade: grade.trim(),
                subject: subject.trim(),
                class_name: className.trim() || undefined,
                student_phone: studentPhone.trim() || undefined,
                guardian_phone: guardianPhone.trim() || undefined,
                school_name: schoolName.trim() || undefined,
                tuition: tuition ? Number(String(tuition).replace(/,/g, '')) : undefined,
            },
            manager_member_ids: Array.from(selectedManagerIds),
        };
        try {
            await updateStudent(updatedData);
        } catch (err) {
            console.error('Failed to update student:', err);
        }
    };
    
    const statusOptions = [
        { value: 'active', label: '재원' },
        { value: 'inactive', label: '휴원' },
        { value: 'resigned', label: '퇴원' },
    ];

    const teacherSuggestions = useMemo(() => {
        return allTeachers.map(t => ({
            id: t.id,
            name: t.details?.student_name || '이름없음'
        }));
    }, [allTeachers]);

    const toggleManagerSelection = (managerId: string) => {
        setSelectedManagerIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(managerId)) newSet.delete(managerId);
            else newSet.add(managerId);
            return newSet;
        });
    };

    return (
        <div className="student-registration-container">
            <h4 className="registration-form-title">학생 정보 수정</h4>
            <form onSubmit={handleSubmit} className="registration-form" noValidate>
                <div className="form-group">
                    <label htmlFor="student-name-edit" className="form-label">이름 *</label>
                    <input id="student-name-edit" type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input" />
                </div>
                <CategoryInput label="상태" value={status} onChange={(newStatus) => setStatus(newStatus as Student['status'])} suggestions={statusOptions} hideInput={true} />
                <CategoryInput label="학년" value={grade} onChange={setGrade} suggestions={GRADE_LEVELS} hideInput={true} required={true} />
                <CategoryInput label="과목" value={subject} onChange={setSubject} suggestions={uniqueSubjects} placeholder="직접 입력 (예: 수학, 영어)" required={true} />

                <ManagerCategoryInput
                    label="담당 강사"
                    suggestions={teacherSuggestions}
                    selectedIds={selectedManagerIds}
                    onToggle={toggleManagerSelection}
                    isLoading={isLoadingStaff}
                />
                
                <CategoryInput label="반" value={className} onChange={setClassName} suggestions={uniqueClassNames} placeholder="직접 입력 (예: 1반, 심화반)" />
                <CategoryInput label="학생 연락처" value={studentPhone} onChange={setStudentPhone} suggestions={[]} placeholder="010-1234-5678" type="tel" />
                <CategoryInput label="학부모 연락처" value={guardianPhone} onChange={setGuardianPhone} suggestions={[]} placeholder="010-9876-5432" type="tel" />
                <CategoryInput label="학교명" value={schoolName} onChange={setSchoolName} suggestions={uniqueSchoolNames} placeholder="직접 입력 (예: OO고등학교)" />
                <CategoryInput label="수강료" value={tuition} onChange={setTuition} suggestions={[]} placeholder="직접 입력 (숫자만)" type="text" />
                
                <div className="form-actions">
                    {updateStudentStatus.isError && <p className="form-error-message">수정 실패: {updateStudentStatus.error?.message}</p>}
                    <button type="submit" className="submit-button" disabled={updateStudentStatus.isPending || !name.trim()}>
                        {updateStudentStatus.isPending ? '저장 중...' : '변경 내용 저장'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentEditForm;