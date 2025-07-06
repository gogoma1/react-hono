import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchEnrollmentsAPI,
    addEnrollmentAPI,
    updateEnrollmentAPI,
    deleteEnrollmentAPI,
} from '../api/studentApi';
// [수정] 새로 만든 types.ts에서 타입들을 가져옵니다.
import type { Enrollment, CreateEnrollmentInput, UpdateEnrollmentInput, Student } from './types';

// [유지] 다른 파일과의 호환성을 위해 쿼리 키를 'students'로 유지합니다.
export const STUDENTS_QUERY_KEY = 'students';

/**
 * [수정]
 * 특정 학원의 재원생(enrollment) 데이터를 관리하는 React Query 훅.
 * 외부 인터페이스(반환값)는 기존 'student' 명칭을 유지하여 UI 코드 변경을 최소화합니다.
 * @param academyId - 관리할 대상 학원의 ID.
 */
export function useStudentDataWithRQ(academyId: string | null | undefined) {
    const queryClient = useQueryClient();

    // API로부터 Enrollment[] 타입을 받지만, 변수명은 students로 유지합니다.
    const {
        data: students = [],
        isLoading: isLoadingStudents,
        isError: isStudentsError,
        error: studentsError,
        refetch: fetchStudents,
    } = useQuery<Enrollment[], Error, Student[]>({ // [수정] select 옵션을 통해 타입을 Student[]로 변환 (타입 별칭 덕분에 사실상 동일)
        queryKey: [STUDENTS_QUERY_KEY, academyId],
        queryFn: () => fetchEnrollmentsAPI(academyId!),
        enabled: !!academyId,
    });

    const addStudentMutation = useMutation<Enrollment, Error, CreateEnrollmentInput>({
        mutationFn: addEnrollmentAPI,
        onSuccess: (newEnrollment) => {
            queryClient.setQueryData<Enrollment[]>([STUDENTS_QUERY_KEY, newEnrollment.academyId], (oldData = []) => 
                [...oldData, newEnrollment]
            );
        },
        onError: (_error, variables) => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY, variables.academyId] });
        }
    });

    const updateStudentMutation = useMutation<Enrollment, Error, UpdateEnrollmentInput>({
        mutationFn: updateEnrollmentAPI,
        onSuccess: (updatedEnrollment) => {
            queryClient.setQueryData<Enrollment[]>([STUDENTS_QUERY_KEY, updatedEnrollment.academyId], (oldData = []) =>
                oldData.map(e => e.id === updatedEnrollment.id ? updatedEnrollment : e)
            );
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
        }
    });

    const deleteStudentMutation = useMutation<{ message: string, id: string }, Error, string>({
        mutationFn: deleteEnrollmentAPI,
        onSuccess: (data) => {
            console.log(`Enrollment ${data.id} deleted successfully.`, data.message);
            // 캐시를 무효화하여 서버로부터 최신 데이터를 다시 가져옵니다.
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY] });
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

        // mutation status 객체도 기존 이름을 유지하며, 타입을 명시해줍니다.
        addStudentStatus: addStudentMutation,
        updateStudentStatus: updateStudentMutation,
        deleteStudentStatus: deleteStudentMutation,
    };
}