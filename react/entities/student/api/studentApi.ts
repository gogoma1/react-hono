// filepath: react-hono/react/entities/student/api/studentApi.ts


import type {
    Student,
    CreateStudentInput,
    UpdateStudentInput,
    UpdateStudentInputBody
} from '../model/useStudentDataWithRQ';
import { handleApiResponse } from '../../../shared/api/api.utils';

// API 경로를 절대경로 대신 상대경로로 사용 (Vite 프록시 활용)
const API_BASE = '/api/manage/student';



export const fetchStudentsAPI = async (): Promise<Student[]> => {
    const res = await fetch(API_BASE, {
        method: 'GET',
        credentials: 'include',
    });
    return handleApiResponse<Student[]>(res);
};

export const addStudentAPI = async (newStudentData: CreateStudentInput): Promise<Student> => {
    const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newStudentData),
    });
    return handleApiResponse<Student>(res);
};

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

export const deleteStudentAPI = async (id: string): Promise<{ message: string; id: string }> => {
    const res = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    });
    return handleApiResponse<{ message: string; id: string }>(res);
};

// Bulk operations
export const bulkUpdateStudentsAPI = async (updates: UpdateStudentInput[]): Promise<Student[]> => {
    return Promise.all(updates.map(update => updateStudentAPI(update)));
};

export const bulkDeleteStudentsAPI = async (ids: string[]): Promise<{ message: string; id: string }[]> => {
    return Promise.all(ids.map(id => deleteStudentAPI(id)));
};