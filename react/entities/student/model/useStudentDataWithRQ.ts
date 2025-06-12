// filepath: react-hono/react/entities/student/model/useStudentDataWithRQ.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // UseMutateAsyncFunction 불필요 시 제거
import {
    fetchStudentsAPI,
    addStudentAPI,
    updateStudentAPI,
    deleteStudentAPI,
    bulkUpdateStudentsAPI,
    bulkDeleteStudentsAPI
} from '../api/studentApi';

// CreateStudentInput 인터페이스
export interface CreateStudentInput {
    student_name: string;
    grade: string;
    status: '재원' | '휴원' | '퇴원';
    subject: string;
    tuition: string | number; // 입력 시 문자열 또는 숫자 허용
    admission_date?: string | null;
    student_phone?: string | null;
    guardian_phone?: string | null;
    school_name?: string | null;
    class?: string | null;
    teacher?: string | null;
    // discharge_date는 생성 시 보통 없음
}

// UpdateStudentInputBody 인터페이스 (body만, id 제외)
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
    class?: string | null;
    teacher?: string | null;
    discharge_date?: string | null;
}

// UpdateStudentInput 전체 (id 포함)
export interface UpdateStudentInput extends UpdateStudentInputBody {
    id: string;
}

export interface Student {
    id: string;
    tuition: number | null;
    admission_date?: string | null;
    discharge_date?: string | null;
    principal_id?: string | null;
    grade: string;
    student_phone?: string | null;
    guardian_phone?: string | null;
    school_name?: string | null;
    class?: string | null;
    student_name: string;
    teacher?: string | null;
    status: '재원' | '휴원' | '퇴원';
    subject: string;
    createdAt: number;
    updatedAt: number;
}


// MutationStatus 타입에 TData 제네릭 추가 (이전 답변에서 이미 반영됨)
export interface MutationStatus<TData = unknown, TError = Error> {
    isPending: boolean;
    isError: boolean;
    error: TError | null;
    isSuccess: boolean;
    data?: TData | undefined; // 성공 데이터 포함
}

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
        queryFn: async () => { // queryFn을 async 함수로 감싸서 로깅 추가
            console.log('[useStudentDataWithRQ] queryFn (fetchStudentsAPI) 호출 시작');
            try {
                const data = await fetchStudentsAPI();
                console.log('[useStudentDataWithRQ] fetchStudentsAPI 결과:', data); // <--- API 실제 반환 데이터 확인!!!
                if (!Array.isArray(data)) {
                    console.error('[useStudentDataWithRQ] fetchStudentsAPI가 배열을 반환하지 않았습니다!', data);
                    // 실제로는 에러를 throw하거나, 빈 배열 또는 에러 처리된 값을 반환해야 할 수 있음
                    // return []; // 또는 throw new Error('Invalid data format');
                }
                return data;
            } catch (err) {
                console.error('[useStudentDataWithRQ] fetchStudentsAPI 호출 중 에러:', err);
                throw err; // 에러를 다시 throw하여 useQuery가 isError 상태로 처리하도록 함
            }
        },
        // staleTime: 1000 * 60 * 5, // 예시: 5분간 fresh 상태 유지
    });

    const addStudentMutation = useMutation<Student, Error, CreateStudentInput>({
        mutationFn: addStudentAPI,
        onSuccess: (newStudent) => {
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) => {
                const updatedList = [...oldData, newStudent];
                return updatedList;
            });
        },
        onError: () => {
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

    // 학생 삭제 뮤테이션: TData를 API 반환 타입과 일치시킴
    const deleteStudentMutation = useMutation<{ message: string, id: string }, Error, string>({
        mutationFn: deleteStudentAPI, // deleteStudentAPI는 Promise<{ message: string, id: string }> 반환
        onSuccess: (_, studentId) => { // data는 { message, id } 객체
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) =>
                oldData.filter(s => s.id !== studentId) // 또는 data.id 사용 가능
            );
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    // 학생 정보 일괄 수정 뮤테이션
    const bulkUpdateStudentsMutation = useMutation<Student[], Error, UpdateStudentInput[]>({
        mutationFn: bulkUpdateStudentsAPI,
        onSuccess: (updatedStudents) => {
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) => {
                let newDataMap = new Map(oldData.map(s => [s.id, s]));
                updatedStudents.forEach(updated => newDataMap.set(updated.id, updated));
                return Array.from(newDataMap.values());
            });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    // 학생 일괄 삭제 뮤테이션: TData를 API 반환 타입과 일치시킴
    const bulkDeleteStudentsMutation = useMutation<{ message: string, id: string }[], Error, string[]>({
        mutationFn: bulkDeleteStudentsAPI, // bulkDeleteStudentsAPI는 Promise<{ message: string, id: string }[]> 반환
        onSuccess: (_: { message: string, id: string }[], idsToRemove) => { // results는 { message, id } 객체의 배열
            queryClient.setQueryData<Student[]>([STUDENTS_QUERY_KEY], (oldData = []) =>
                oldData.filter(s => !idsToRemove.includes(s.id))
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
        bulkUpdateStudents: bulkUpdateStudentsMutation.mutateAsync,
        bulkDeleteStudents: bulkDeleteStudentsMutation.mutateAsync,

        // MutationStatus 타입에 TData 제네릭 적용
        addStudentStatus: {
            isPending: addStudentMutation.isPending,
            isError: addStudentMutation.isError,
            error: addStudentMutation.error,
            isSuccess: addStudentMutation.isSuccess,
            data: addStudentMutation.data, // 성공 시 Student 데이터
        } as MutationStatus<Student, Error>,

        updateStudentStatus: {
            isPending: updateStudentMutation.isPending,
            isError: updateStudentMutation.isError,
            error: updateStudentMutation.error,
            isSuccess: updateStudentMutation.isSuccess,
            data: updateStudentMutation.data, // 성공 시 Student 데이터
        } as MutationStatus<Student, Error>,

        deleteStudentStatus: { // TData 타입 수정
            isPending: deleteStudentMutation.isPending,
            isError: deleteStudentMutation.isError,
            error: deleteStudentMutation.error,
            isSuccess: deleteStudentMutation.isSuccess,
            data: deleteStudentMutation.data, // 성공 시 { message: string, id: string } 데이터
        } as MutationStatus<{ message: string, id: string }, Error>,

        bulkUpdateStudentsStatus: {
            isPending: bulkUpdateStudentsMutation.isPending,
            isError: bulkUpdateStudentsMutation.isError,
            error: bulkUpdateStudentsMutation.error,
            isSuccess: bulkUpdateStudentsMutation.isSuccess,
            data: bulkUpdateStudentsMutation.data, // 성공 시 Student[] 데이터
        } as MutationStatus<Student[], Error>,

        bulkDeleteStudentsStatus: { // TData 타입 수정
            isPending: bulkDeleteStudentsMutation.isPending,
            isError: bulkDeleteStudentsMutation.isError,
            error: bulkDeleteStudentsMutation.error,
            isSuccess: bulkDeleteStudentsMutation.isSuccess,
            data: bulkDeleteStudentsMutation.data, // 성공 시 { message: string, id: string }[] 데이터
        } as MutationStatus<{ message: string, id: string }[], Error>,
    };
}

