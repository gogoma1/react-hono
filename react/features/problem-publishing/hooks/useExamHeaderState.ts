// ./react/features/problem-publishing/hooks/useExamHeaderState.ts
import { useState, useCallback } from 'react';

type HeaderUpdateValue = {
    text: string;
    fontSize?: number;
    fontFamily?: string;
};

export function useExamHeaderState() {
    const [headerInfo, setHeaderInfo] = useState({
        title: '2025학년도 3월 전국연합학력평가', titleFontSize: 1.64, titleFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        school: '제2교시', schoolFontSize: 1, schoolFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        subject: '수학 영역', subjectFontSize: 3, subjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedSubjectText: '수학 영역', simplifiedSubjectFontSize: 1.6, simplifiedSubjectFontFamily: "'NanumGothic', 'Malgun Gothic', sans-serif",
        simplifiedGradeText: '고3',
    });

    const handleHeaderUpdate = useCallback((targetId: string, _field: string, value: HeaderUpdateValue) => {
        setHeaderInfo(prev => {
            const newState = { ...prev };
            const newFontSize = value.fontSize;

            switch (targetId) {
                case 'title':
                    newState.title = value.text;
                    if (newFontSize !== undefined) newState.titleFontSize = newFontSize;
                    break;
                case 'school':
                    newState.school = value.text;
                    if (newFontSize !== undefined) newState.schoolFontSize = newFontSize;
                    break;
                case 'subject':
                    newState.subject = value.text;
                    if (newFontSize !== undefined) newState.subjectFontSize = newFontSize;
                    break;
                case 'simplifiedSubject':
                    newState.simplifiedSubjectText = value.text;
                    if (newFontSize !== undefined) newState.simplifiedSubjectFontSize = newFontSize;
                    break;
                case 'simplifiedGrade':
                    newState.simplifiedGradeText = value.text;
                    break;
            }
            return newState;
        });
    }, []);

    return {
        headerInfo,
        onHeaderUpdate: handleHeaderUpdate,
    };
}