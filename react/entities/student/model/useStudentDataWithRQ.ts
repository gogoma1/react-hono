import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchMembersAPI,
    addMemberAPI,
    updateMemberAPI,
    resignMemberAPI,
} from '../api/studentApi';
import type { AcademyMember, CreateMemberInput, UpdateMemberInput, Student } from './types';

export const STUDENTS_QUERY_KEY = 'students';

interface StudentMutationContext {
    previousStudents?: Student[];
}

/**
 * 특정 학원의 학생(member) 데이터를 관리하는 React Query 훅.
 * staleTime을 Infinity로 설정하여 캐시를 적극적으로 활용합니다.
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

        // [핵심 수정] 캐싱 시간을 무한으로 설정합니다.
        staleTime: Infinity,
        // gcTime도 길게 설정하여 브라우저 세션 동안 캐시가 유지되도록 합니다.
        gcTime: 1000 * 60 * 60 * 24, // 24시간
        
        select: (data) => data.map(member => {
            const teacherNames = member.managers?.map(m => m.details?.student_name).filter(Boolean).join(', ');
            
            return {
                ...member,
                student_name: member.details?.student_name ?? '이름 없음',
                grade: member.details?.grade ?? '미지정',
                subject: member.details?.subject ?? '미지정',
                student_phone: member.details?.student_phone,
                guardian_phone: member.details?.guardian_phone,
                school_name: member.details?.school_name,
                class_name: member.details?.class_name,
                teacher: teacherNames || '-',
                tuition: member.details?.tuition,
                admission_date: member.start_date,
                discharge_date: member.end_date,
                managers: member.managers,
            };
        })
    });

    const addStudentMutation = useMutation<AcademyMember, Error, CreateMemberInput>({
        mutationFn: addMemberAPI,
        onSuccess: (newMember) => {
            queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY, newMember.academy_id] });
        },
    });

    const updateStudentMutation = useMutation<AcademyMember, Error, UpdateMemberInput, StudentMutationContext>({
        mutationFn: updateMemberAPI,
        onMutate: async (updatedStudentData) => {
            await queryClient.cancelQueries({ queryKey });
            const previousStudents = queryClient.getQueryData<Student[]>(queryKey);

            if (previousStudents) {
                queryClient.setQueryData<Student[]>(queryKey, old =>
                    old?.map(student => {
                        if (student.id !== updatedStudentData.id) return student;

                        // 업데이트된 내용을 기반으로 새 학생 객체 생성
                        const newStudent = { ...student };
                        if (updatedStudentData.status) newStudent.status = updatedStudentData.status;
                        if (updatedStudentData.start_date) newStudent.start_date = updatedStudentData.start_date;
                        if (updatedStudentData.end_date) newStudent.end_date = updatedStudentData.end_date;
                        
                        if (updatedStudentData.details) {
                            newStudent.details = { ...student.details, ...updatedStudentData.details };
                            // details 내부의 필드들도 최상위 레벨에 업데이트 (호환성)
                            newStudent.student_name = updatedStudentData.details.student_name ?? student.student_name;
                            newStudent.grade = updatedStudentData.details.grade ?? student.grade;
                            // ... 등등
                        }
                        return newStudent;
                    }) ?? []
                );
            }
            return { previousStudents };
        },
        onError: (_err, _updatedStudent, context) => {
            if (context?.previousStudents) {
                queryClient.setQueryData(queryKey, context.previousStudents);
            }
        },
        onSettled: (data) => {
            if (data) {
                queryClient.invalidateQueries({ queryKey: [STUDENTS_QUERY_KEY, data.academy_id] });
            } else {
                queryClient.invalidateQueries({ queryKey });
            }
        },
    });

    const deleteStudentMutation = useMutation<{ message: string, id: string }, Error, string, StudentMutationContext>({
        mutationFn: resignMemberAPI,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
        onMutate: async (memberId) => {
            await queryClient.cancelQueries({ queryKey });
            const previousStudents = queryClient.getQueryData<Student[]>(queryKey);

            if (previousStudents) {
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