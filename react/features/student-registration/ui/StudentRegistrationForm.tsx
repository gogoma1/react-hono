import React, { useState, useMemo, useEffect } from 'react';
import { GRADE_LEVELS, type CreateEnrollmentInput, type Student } from '../../../entities/student/model/types';
import { useStudentDataWithRQ } from '../../../entities/student/model/useStudentDataWithRQ';
import CategoryInput from './CategoryInput';
import './StudentRegistrationForm.css';
import { LuUserPlus } from 'react-icons/lu';

// [수정] Props 타입에 allStudents 추가
interface StudentRegistrationFormProps {
    onSuccess?: () => void;
    academyId: string;
    allStudents: Student[];
}

const getUniqueValues = <T extends object>(items: T[], key: keyof T): (string | number)[] => {
    if (!items || items.length === 0) {
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

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ onSuccess, academyId, allStudents }) => {
    // [수정] add 관련 훅만 사용하고, 데이터는 props로 받은 allStudents를 기반으로 생성
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

    // [수정] useMemo의 의존성을 props로 받은 allStudents로 변경
    const uniqueClassNames = useMemo(() => getUniqueValues(allStudents, 'class_name').sort(), [allStudents]);
    const uniqueSubjects = useMemo(() => getUniqueValues(allStudents, 'subject').sort(), [allStudents]);
    const uniqueSchoolNames = useMemo(() => getUniqueValues(allStudents, 'school_name').sort(), [allStudents]);
    const uniqueTuitions = useMemo(() => getUniqueValues(allStudents, 'tuition').sort((a,b) => (a as number) - (b as number)), [allStudents]);
    const uniqueTeachers = useMemo(() => getUniqueValues(allStudents, 'teacher').sort(), [allStudents]);

    const resetForm = () => {
        setName(''); 
        setGrade(''); 
        setSubject(''); 
        setClassName(''); 
        setTeacher('');
        setStudentPhone(''); 
        setGuardianPhone('');
        setSchoolName(''); 
        setTuition('');
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
        
        const newStudentData: CreateEnrollmentInput = {
            academy_id: academyId,
            student_name: name.trim(),
            grade: grade.trim(),
            subject: subject.trim(),
            status: '재원',
            class_name: className.trim() || null,
            teacher: teacher.trim() || null,
            student_phone: studentPhone.trim() || null,
            guardian_phone: guardianPhone.trim() || null,
            school_name: schoolName.trim() || null,
            tuition: tuition ? Number(String(tuition).replace(/,/g, '')) : null,
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