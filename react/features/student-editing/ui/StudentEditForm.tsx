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

// [최종 수정] reduce를 사용하여 타입 안정성을 높인 getUniqueValues 함수
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