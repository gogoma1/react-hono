import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchMembersAPI,
    addMemberAPI,
    updateMemberAPI,
    resignMemberAPI,
} from '../api/studentApi';
import type { AcademyMember, CreateMemberInput, UpdateMemberInput, Student } from './types';

export const STUDENTS_QUERY_KEY = 'students';

// [핵심] onMutate에서 반환될 컨텍스트 타입을 정의합니다.
interface StudentMutationContext {
    previousStudents?: Student[];
}

/**
 * 특정 학원의 구성원(member) 데이터를 관리하는 React Query 훅.
 * staleTime과 낙관적 업데이트를 적용하여 성능과 사용자 경험을 개선합니다.
 * @param academyId - 관리할 대상 학원의 ID.
 */
export function useStudentDataWithRQ(academyId: string | null | undefined) {
    const queryClient = useQueryClient();
    const queryKey = [STUDENTS_QUERY_KEY, academyId];

    const {
        data: students = [],
        isLoading: isLoadingStudents,
        isError: isStudentsError,
        error: studentsError,
        refetch: fetchStudents,
    } = useQuery<AcademyMember[], Error, Student[]>({
        queryKey: queryKey,
        queryFn: () => fetchMembersAPI(academyId!),
        enabled: !!academyId,
        // [개선] staleTime을 추가하여 2분간 캐시 데이터를 신선한 것으로 간주합니다.
        staleTime: 1000 * 60 * 2,
        select: (data) => data.map(member => ({
            ...member,
            student_name: member.details?.student_name ?? '이름 없음',
            grade: member.details?.grade ?? '미지정',
            subject: member.details?.subject ?? '미지정',
            student_phone: member.details?.student_phone,
            guardian_phone: member.details?.guardian_phone,
            school_name: member.details?.school_name,
            class_name: member.details?.class_name,
            teacher: member.details?.teacher,
            tuition: member.details?.tuition,
            admission_date: member.start_date,
            discharge_date: member.end_date
        }))
    });

    // 신규 학생 추가 Mutation
    const addStudentMutation = useMutation<AcademyMember, Error, CreateMemberInput>({
        mutationFn: addMemberAPI,
        onSuccess: (newMember) => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY, newMember.academy_id] });
        },
    });

    // 학생 정보 수정 Mutation (낙관적 업데이트 적용)
    const updateStudentMutation = useMutation<AcademyMember, Error, UpdateMemberInput, StudentMutationContext>({
        mutationFn: updateMemberAPI,
        onMutate: async (updatedStudent) => {
            await queryClient.cancelQueries({ queryKey });
            const previousStudents = queryClient.getQueryData<Student[]>(queryKey);

            if (previousStudents) {
                queryClient.setQueryData<Student[]>(queryKey, old =>
                    old?.map(student =>
                        student.id === updatedStudent.id
                            ? {
                                ...student,
                                status: updatedStudent.status ?? student.status,
                                details: { ...student.details, ...updatedStudent.details },
                                start_date: updatedStudent.start_date ?? student.start_date,
                                end_date: updatedStudent.end_date ?? student.end_date,
                                // select 함수에서 처리하는 필드들도 수동 업데이트
                                student_name: updatedStudent.details?.student_name ?? student.details?.student_name,
                                grade: updatedStudent.details?.grade ?? student.details?.grade,
                                subject: updatedStudent.details?.subject ?? student.details?.subject,
                                class_name: updatedStudent.details?.class_name ?? student.details?.class_name,
                                teacher: updatedStudent.details?.teacher ?? student.details?.teacher,
                                student_phone: updatedStudent.details?.student_phone ?? student.details?.student_phone,
                                guardian_phone: updatedStudent.details?.guardian_phone ?? student.details?.guardian_phone,
                                school_name: updatedStudent.details?.school_name ?? student.details?.school_name,
                                tuition: updatedStudent.details?.tuition ?? student.details?.tuition,
                                admission_date: updatedStudent.start_date ?? student.start_date,
                                discharge_date: updatedStudent.end_date ?? student.end_date,
                            }
                            : student
                    ) ?? []
                );
            }
            return { previousStudents };
        },
        onError: (_err, _updatedStudent, context) => {
            if (context?.previousStudents) {
                queryClient.setQueryData(queryKey, context.previousStudents);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // 학생 상태 변경(삭제) Mutation (낙관적 업데이트 적용)
    const deleteStudentMutation = useMutation<{ message: string, id: string }, Error, string, StudentMutationContext>({
        mutationFn: resignMemberAPI,
        onMutate: async (memberId) => {
            await queryClient.cancelQueries({ queryKey });
            const previousStudents = queryClient.getQueryData<Student[]>(queryKey);

            if (previousStudents) {
                // UI에서는 'resigned' 상태로 즉시 변경
                queryClient.setQueryData<Student[]>(queryKey, old =>
                    old?.map(s => s.id === memberId ? { ...s, status: 'resigned' } : s) ?? []
                );
            }
            return { previousStudents };
        },
        onError: (_err, _vars, context) => {
            if(context?.previousStudents) {
                queryClient.setQueryData(queryKey, context.previousStudents);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
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

        addStudentStatus: addStudentMutation,
        updateStudentStatus: updateStudentMutation,
        deleteStudentStatus: deleteStudentMutation,
    };
}