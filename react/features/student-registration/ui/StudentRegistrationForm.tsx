import React, { useState, useMemo, useEffect } from 'react';
import { 
    GRADE_LEVELS, 
    type Student, 
    type CreateStudentInput,
    type MemberDetails // [신규] MemberDetails 타입 임포트
} from '../../../entities/student/model/types';
import { useStudentDataWithRQ } from '../../../entities/student/model/useStudentDataWithRQ';
import CategoryInput from './CategoryInput';
import './StudentRegistrationForm.css';
import { LuUserPlus } from 'react-icons/lu';

interface StudentRegistrationFormProps {
    onSuccess?: () => void;
    academyId: string;
    allStudents: Student[];
}

// [신규] 타입-안전한 헬퍼 함수 정의
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

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ onSuccess, academyId, allStudents }) => {
    const { addStudent, addStudentStatus } = useStudentDataWithRQ(academyId);

    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [subject, setSubject] = useState('');
    const [className, setClassName] = useState('');
    const [teacher, setTeacher] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tuition, setTuition] = useState('');

    // [수정] 새로운 헬퍼 함수를 사용하도록 변경
    const uniqueClassNames = useMemo(() => getUniqueValuesFromDetails(allStudents, 'class_name'), [allStudents]);
    const uniqueSubjects = useMemo(() => getUniqueValuesFromDetails(allStudents, 'subject'), [allStudents]);
    const uniqueSchoolNames = useMemo(() => getUniqueValuesFromDetails(allStudents, 'school_name'), [allStudents]);
    const uniqueTeachers = useMemo(() => getUniqueValuesFromDetails(allStudents, 'teacher'), [allStudents]);
    const uniqueTuitions = useMemo(() => getUniqueValuesFromDetails(allStudents, 'tuition'), [allStudents]);

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
        
        const newStudentData: CreateStudentInput = {
            academy_id: academyId,
            member_type: 'student',
            details: {
                student_name: name.trim(),
                grade: grade.trim(),
                subject: subject.trim(),
                class_name: className.trim() || undefined,
                teacher: teacher.trim() || undefined,
                student_phone: studentPhone.trim() || undefined,
                guardian_phone: guardianPhone.trim() || undefined,
                school_name: schoolName.trim() || undefined,
                tuition: tuition ? Number(String(tuition).replace(/,/g, '')) : undefined,
            }
        };
        try {
            await addStudent(newStudentData);
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
                    required={true}
                />
                <CategoryInput 
                    label="과목" 
                    value={subject} 
                    onChange={setSubject} 
                    suggestions={uniqueSubjects} 
                    placeholder="직접 입력 (예: 수학, 영어)"
                    required={true}
                />
                <CategoryInput label="반" value={className} onChange={setClassName} suggestions={uniqueClassNames} placeholder="직접 입력 (예: 1반, 심화반)"/>
                <CategoryInput label="담당 강사" value={teacher} onChange={setTeacher} suggestions={uniqueTeachers} placeholder="직접 입력 (예: 김리액)"/>
                <CategoryInput label="학생 연락처" value={studentPhone} onChange={setStudentPhone} suggestions={[]} placeholder="010-1234-5678" type="tel"/>
                <CategoryInput 
                    label="학부모 연락처" 
                    value={guardianPhone} 
                    onChange={setGuardianPhone} 
                    suggestions={[]} 
                    placeholder="010-9876-5432" 
                    type="tel"
                />
                <CategoryInput label="학교명" value={schoolName} onChange={setSchoolName} suggestions={uniqueSchoolNames} placeholder="직접 입력 (예: OO고등학교)"/>
                <CategoryInput label="수강료" value={tuition} onChange={setTuition} suggestions={uniqueTuitions} placeholder="직접 입력 (숫자만)" type="text"/>

                <div className="form-actions">
                    {addStudentStatus.isError && (
                        <p className="form-error-message">등록 실패: {addStudentStatus.error?.message}</p>
                    )}
                    <button type="submit" className="submit-button" disabled={addStudentStatus.isPending || !name.trim() || !grade.trim() || !subject.trim()}>
                        {addStudentStatus.isPending ? '등록 중...' : '학생 등록하기'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentRegistrationForm;