import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProblemsAndCreateSetAPI, updateProblemAPI, deleteProblemsAPI } from '../api/problemApi';
import type { Problem } from './types';
import { PROBLEMS_QUERY_KEY } from './useProblemsQuery';
import { useToast } from '../../../shared/store/toastStore';
import type { UploadResponse } from '../api/problemApi';

interface UpdateProblemVariables {
  id: string; 
  fields: Partial<Problem>;
}

interface ProblemMutationContext {
    previousProblems?: Problem[];
}

// [수정] 문제 업로드 및 문제집 생성 페이로드 타입 정의
interface UploadProblemsAndCreateSetPayload {
    problemSetName: string;
    description: string | null;
    problems: Problem[];
    grade: string | null;
    folder_id?: string | null;
    type: "PUBLIC_ADMIN" | "PRIVATE_USER";
    status: "published" | "private" | "deleted";
    copyright_type: "ORIGINAL_CREATION" | "COPYRIGHTED_MATERIAL";
    copyright_source: string | null;
}

export function useUpdateProblemMutation() {
    const queryClient = useQueryClient();
    const queryKey = [PROBLEMS_QUERY_KEY];

    return useMutation<Problem, Error, UpdateProblemVariables, ProblemMutationContext>({
        mutationFn: (variables) => updateProblemAPI(variables.id, variables.fields),
        onMutate: async (updatedProblem) => {
            await queryClient.cancelQueries({ queryKey });
            const previousProblems = queryClient.getQueryData<Problem[]>(queryKey);
            if (previousProblems) {
                queryClient.setQueryData<Problem[]>(queryKey, old => 
                    old?.map(problem => 
                        problem.problem_id === updatedProblem.id 
                            ? { ...problem, ...updatedProblem.fields }
                            : problem
                    ) ?? []
                );
            }
            return { previousProblems };
        },
        onError: (_err, _newProblem, context) => {
            if (context?.previousProblems) {
                queryClient.setQueryData(queryKey, context.previousProblems);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

export function useDeleteProblemsMutation() {
    const queryClient = useQueryClient();
    const toast = useToast(); 

    return useMutation<{ message: string, deleted_count: number }, Error, string[], ProblemMutationContext>({
        mutationFn: (problemIds) => deleteProblemsAPI(problemIds),
        onMutate: async (problemIdsToDelete) => {
            const queryKey = [PROBLEMS_QUERY_KEY];
            await queryClient.cancelQueries({ queryKey });
            const previousProblems = queryClient.getQueryData<Problem[]>(queryKey);
            if (previousProblems) {
                const idsToDeleteSet = new Set(problemIdsToDelete);
                queryClient.setQueryData<Problem[]>(queryKey, old => 
                    old?.filter(p => !idsToDeleteSet.has(p.problem_id)) ?? []
                );
            }
            return { previousProblems };
        },
        onError: (err, _vars, context) => {
            toast.error(`문제 삭제 실패: ${err.message}`);
            if(context?.previousProblems) {
                queryClient.setQueryData([PROBLEMS_QUERY_KEY], context.previousProblems);
            }
        },
        onSettled: (data) => {
            if (data?.message) {
                toast.info(data.message);
            }
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
        },
    });
}

/**
 * [수정] 문제와 문제집 정보를 함께 업로드하는 Mutation
 */
export function useUploadProblemsMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<UploadResponse, Error, UploadProblemsAndCreateSetPayload>({
        mutationFn: (payload) => uploadProblemsAndCreateSetAPI(payload),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ['myProblemSets'] });
            queryClient.invalidateQueries({ queryKey: ['groupedProblemSets'] }); // [신규] 그룹 뷰도 무효화
        },
        onError: (error) => {
            toast.error(`문제집 생성 실패: ${error.message}`);
            console.error('Upload failed:', error);
        },
    });
}