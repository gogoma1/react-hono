import { useMutation, useQueryClient } from '@tanstack/react-query';
// [수정] 새 API 함수 import
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

    // [수정] 제네릭 타입의 payload를 any로 하여 유연성 확보
    return useMutation<UploadResponse, Error, any>({
        mutationFn: (payload) => uploadProblemsAndCreateSetAPI(payload),
        onSuccess: (data) => {
            toast.success(data.message);
            // 성공 시 관련 쿼리 무효화
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: ['myProblemSets'] });
        },
        onError: (error) => {
            toast.error(`문제집 생성 실패: ${error.message}`);
            console.error('Upload failed:', error);
        },
    });
}