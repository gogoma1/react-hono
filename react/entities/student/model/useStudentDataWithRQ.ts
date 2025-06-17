//file path : react/entities/student/model/useStudentDataWithRQ.ts
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
            // 새 학생 추가 성공 시, 서버에 목록을 재요청하는 대신 캐시를 직접 업데이트합니다.
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) => 
                [...oldData, newStudent]
            );
        },
        onError: () => {
            // 에러 발생 시 데이터 정합성을 위해 캐시를 무효화하고 다시 동기화합니다.
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