import React, { useState, useMemo, useEffect } from 'react';
import { useStudentDataWithRQ, type CreateStudentInput, GRADE_LEVELS } from '../../../entities/student/model/useStudentDataWithRQ';
import CategoryInput from './CategoryInput';
import './StudentRegistrationForm.css';
import { LuUserPlus } from 'react-icons/lu';

interface StudentRegistrationFormProps {
    onSuccess?: () => void;
}

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