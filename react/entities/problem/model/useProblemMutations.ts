import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProblemsAPI, updateProblemAPI, deleteProblemsAPI } from '../api/problemApi';
import type { Problem } from './types';
import { PROBLEMS_QUERY_KEY } from './useProblemsQuery';
import { useToast } from '../../../shared/store/toastStore';

import type { UploadResponse } from '../api/problemApi';

interface UpdateProblemVariables {
  id: string; 
  fields: Partial<Problem>;
}

// [핵심] onMutate에서 반환될 컨텍스트 타입을 정의합니다.
interface ProblemMutationContext {
    previousProblems?: Problem[];
}

/**
 * 문제 수정을 위한 React Query Mutation
 */
export function useUpdateProblemMutation() {
    const queryClient = useQueryClient();
    const queryKey = [PROBLEMS_QUERY_KEY]; // 전체 문제 목록에 대한 쿼리 키

    // [핵심 수정] useMutation의 제네릭에 컨텍스트 타입을 추가합니다.
    return useMutation<Problem, Error, UpdateProblemVariables, ProblemMutationContext>({
        mutationFn: (variables) => updateProblemAPI(variables.id, variables.fields),
        // [개선] 낙관적 업데이트 적용
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
            // [수정] context 타입이 올바르게 추론되어 오류가 사라집니다.
            if (context?.previousProblems) {
                queryClient.setQueryData(queryKey, context.previousProblems);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });
}

/**
 * 단일/다중 문제 영구 삭제를 위한 React Query Mutation
 */
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
 * 문제 업로드(생성/수정)를 위한 React Query Mutation
 */
export function useUploadProblemsMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<UploadResponse, Error, Problem[]>({
        mutationFn: (problems) => uploadProblemsAPI(problems),
        onSuccess: (data) => {
            let message = "작업이 완료되었습니다.";
            if (data.created > 0 && data.updated > 0) {
                message = `${data.created}개의 문제가 생성되었고, ${data.updated}개의 문제가 업데이트되었습니다.`;
            } else if (data.created > 0) {
                message = `${data.created}개의 문제가 성공적으로 생성되었습니다.`;
            } else if (data.updated > 0) {
                message = `${data.updated}개의 문제가 성공적으로 업데이트되었습니다.`;
            }
            toast.success(message);
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`문제 업로드 실패: ${error.message}`);
            console.error('Upload failed:', error);
        },
    });
}