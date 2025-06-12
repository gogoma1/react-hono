import React, { useState, useMemo, useEffect } from 'react';
import { useStudentDataWithRQ, type CreateStudentInput } from '../../../entities/student/model/useStudentDataWithRQ';
import CategoryInput from './CategoryInput';
import './StudentRegistrationForm.css';
import { LuUserPlus } from 'react-icons/lu';

const getUniqueValues = <T, K extends keyof T>(items: T[], key: K): (T[K] extends (string | number) ? T[K] : never)[] => {
    if (!items || items.length === 0) return [];
    const uniqueSet = new Set(items.map(item => item[key]).filter(value => value != null && String(value).trim() !== ''));
    // @ts-ignore
    return Array.from(uniqueSet);
};

const StudentRegistrationForm: React.FC = () => {
    const { students, addStudent, addStudentStatus } = useStudentDataWithRQ();

    // Form state
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [subject, setSubject] = useState('');
    const [studentPhone, setStudentPhone] = useState('');
    const [guardianPhone, setGuardianPhone] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [tuition, setTuition] = useState('');

    // Generate unique suggestions for buttons
    const uniqueGrades = useMemo(() => getUniqueValues(students, 'grade').sort(), [students]);
    const uniqueSubjects = useMemo(() => getUniqueValues(students, 'subject').sort(), [students]);
    const uniqueSchoolNames = useMemo(() => getUniqueValues(students, 'school_name').sort(), [students]);
    const uniqueTuitions = useMemo(() => getUniqueValues(students, 'tuition').sort((a,b) => (a as number) - (b as number)), [students]);

    const resetForm = () => {
        setName('');
        setGrade('');
        setSubject('');
        setStudentPhone('');
        setGuardianPhone('');
        setSchoolName('');
        setTuition('');
    };
    
    useEffect(() => {
        if (addStudentStatus.isSuccess) {
            // 여기에 성공 토스트 메시지 등을 추가하면 좋습니다.
            // 예: alert(`${addStudentStatus.data?.student_name} 학생이 등록되었습니다!`);
            resetForm();
        }
    }, [addStudentStatus.isSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const newStudent: CreateStudentInput = {
            student_name: name.trim(),
            grade: grade.trim(),
            subject: subject.trim(),
            student_phone: studentPhone.trim() || null,
            guardian_phone: guardianPhone.trim() || null,
            school_name: schoolName.trim() || null,
            tuition: tuition ? Number(String(tuition).replace(/,/g, '')) : 0,
            status: '재원', // 신입생은 기본 '재원' 상태
        };

        try {
            await addStudent(newStudent);
        } catch (err) {
            console.error('Failed to add student:', err);
             // 여기에 에러 토스트 메시지를 추가하면 좋습니다.
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
                    suggestions={uniqueGrades}
                    placeholder="직접 입력 (예: 고1, 중3)"
                />

                <CategoryInput 
                    label="과목"
                    value={subject}
                    onChange={setSubject}
                    suggestions={uniqueSubjects}
                    placeholder="직접 입력 (예: 수학, 영어)"
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
                    suggestions={uniqueTuitions}
                    placeholder="직접 입력 (숫자만)"
                    type="text" // number 타입은 사용자 입력 편의성을 저해할 수 있어 text로 변경
                    // 숫자만 입력되도록 처리하려면 추가 로직 필요
                />

                <div className="form-actions">
                    {addStudentStatus.isError && (
                        <p className="form-error-message">등록 실패: {addStudentStatus.error?.message}</p>
                    )}
                    <button type="submit" className="submit-button" disabled={addStudentStatus.isPending || !name}>
                        {addStudentStatus.isPending ? '등록 중...' : '학생 등록하기'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentRegistrationForm;