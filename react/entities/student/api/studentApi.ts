//file: react/entities/student/api/studentApi.ts

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