import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createEntitlementAPI, addProblemsToSetAPI, updateProblemSetAPI, deleteProblemSetAPI } from '../api/problemSetApi';
import type { CreateEntitlementPayload, AddProblemsToSetPayload, CreatedProblemSet, UpdateProblemSetPayload, MyProblemSet } from './types';
import { MY_PROBLEM_SETS_QUERY_KEY } from './useProblemSetQuery';
import { useToast } from '../../../shared/store/toastStore';

/**
 * PostgreSQL에 권한 생성을 위한 Mutation
 */
export function useCreateEntitlementMutation() {
    const toast = useToast();
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean, message: string }, Error, CreateEntitlementPayload>({
        mutationFn: (payload) => createEntitlementAPI(payload),
        onSuccess: (data) => {
            toast.success(data.message || '권한이 성공적으로 설정되었습니다.');
            queryClient.invalidateQueries({ queryKey: [MY_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            console.error("권한 생성 실패:", error);
            toast.error(`권한 생성 실패: ${error.message}`);
        },
    });
}

/**
 * 기존 문제집에 문제를 추가하기 위한 Mutation
 */
export function useAddProblemsToSetMutation() {
    const toast = useToast();
    const queryClient = useQueryClient();

    return useMutation<
        { message: string }, 
        Error, 
        { problemSetId: string; payload: AddProblemsToSetPayload }
    >({
        mutationFn: ({ problemSetId, payload }) => addProblemsToSetAPI(problemSetId, payload),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: [MY_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            console.error("문제집에 문제 추가 실패:", error);
            toast.error(`문제 추가 실패: ${error.message}`);
        },
    });
}

export function useUpdateProblemSetMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<
        CreatedProblemSet, 
        Error, 
        { problemSetId: string; payload: UpdateProblemSetPayload }
    >({
        mutationFn: ({ problemSetId, payload }) => updateProblemSetAPI(problemSetId, payload),
        onSuccess: (data) => {
            queryClient.setQueryData<MyProblemSet[]>([MY_PROBLEM_SETS_QUERY_KEY], (oldData) =>
                oldData?.map((ps) =>
                    ps.problem_set_id === data.problem_set_id ? { ...ps, ...data } : ps
                ) ?? []
            );
            toast.success(`'${data.name}' 정보가 수정되었습니다.`);
        },
        onError: (error) => {
            toast.error(`문제집 수정 실패: ${error.message}`);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [MY_PROBLEM_SETS_QUERY_KEY] });
        }
    });
}

export function useDeleteProblemSetMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<void, Error, string>({
        mutationFn: (problemSetId) => deleteProblemSetAPI(problemSetId),
        onSuccess: (_, problemSetId) => {
            toast.info('문제집이 삭제되었습니다.');
            queryClient.setQueryData<MyProblemSet[]>([MY_PROBLEM_SETS_QUERY_KEY], (oldData) =>
                oldData?.filter((ps) => ps.problem_set_id !== problemSetId) ?? []
            );
        },
        onError: (error) => {
            toast.error(`문제집 삭제 실패: ${error.message}`);
        },
    });
}