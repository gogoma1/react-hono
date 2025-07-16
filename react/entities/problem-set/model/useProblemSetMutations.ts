import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createEntitlementAPI,
    addProblemsToSetAPI,
    updateProblemSetAPI,
    deleteProblemSetAPI,
    deleteSubtitleFromSetAPI,
    createFolderAPI,
    updateFolderAPI,
    deleteFolderAPI,
    moveSubtitleAPI // [신규]
} from '../api/problemSetApi';
import type { CreateEntitlementPayload, AddProblemsToSetPayload, CreatedProblemSet, UpdateProblemSetPayload, Folder, UpdatedSubtitle } from './types';
import { GROUPED_PROBLEM_SETS_QUERY_KEY } from './useProblemSetQuery';
import { useToast } from '../../../shared/store/toastStore';

interface CreateFolderPayload {
    name: string;
    problemSetId: string;
    gradeId: string;
}

// [신규] 소제목 이동 뮤테이션 타입
interface MoveSubtitlePayload {
    subtitleId: string;
    targetFolderId: string | null;
}

export function useCreateFolderMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation<Folder, Error, CreateFolderPayload>({
        mutationFn: (payload) => createFolderAPI(payload),
        onSuccess: (data) => {
            toast.success(`'${data.name}' 그룹이 생성되었습니다.`);
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`그룹 생성 실패: ${error.message}`);
        },
    });
}

export function useUpdateFolderMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation<Folder, Error, { folderId: string; name: string }>({
        mutationFn: ({ folderId, name }) => updateFolderAPI(folderId, name),
        onSuccess: (data) => {
            toast.success(`그룹 이름이 '${data.name}'(으)로 수정되었습니다.`);
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`그룹 수정 실패: ${error.message}`);
        },
    });
}

export function useDeleteFolderMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation<{ message: string }, Error, string>({
        mutationFn: (folderId) => deleteFolderAPI(folderId),
        onSuccess: (data) => {
            toast.info(data.message);
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`그룹 삭제 실패: ${error.message}`);
        },
    });
}

/**
 * [신규] 소제목을 폴더로 이동시키는 Mutation
 */
export function useMoveSubtitleMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation<UpdatedSubtitle, Error, MoveSubtitlePayload>({
        mutationFn: (payload) => moveSubtitleAPI(payload),
        onSuccess: () => {
            toast.success('소제목이 그룹으로 이동되었습니다.');
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`이동 실패: ${error.message}`);
            // 필요하다면 optimistic update 롤백
        },
    });
}

export function useCreateEntitlementMutation() {
    const toast = useToast();
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean, message: string }, Error, CreateEntitlementPayload>({
        mutationFn: (payload) => createEntitlementAPI(payload),
        onSuccess: (data) => {
            toast.success(data.message || '권한이 성공적으로 설정되었습니다.');
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            console.error("권한 생성 실패:", error);
            toast.error(`권한 생성 실패: ${error.message}`);
        },
    });
}

/**
 * [핵심 수정] 뮤테이션 훅의 변수 타입을 새로운 API 페이로드에 맞게 수정합니다.
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
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
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
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
            toast.success(`'${data.name}' 정보가 수정되었습니다.`);
        },
        onError: (error) => {
            toast.error(`문제집 수정 실패: ${error.message}`);
        }
    });
}

export function useDeleteProblemSetMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<void, Error, string>({
        mutationFn: (problemSetId) => deleteProblemSetAPI(problemSetId),
        onSuccess: () => {
            toast.info('문제집이 삭제되었습니다.');
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`문제집 삭제 실패: ${error.message}`);
        },
    });
}

export function useDeleteSubtitleFromSetMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();

    return useMutation<
        { message: string },
        Error,
        { problemSetId: string; subtitleId: string }
    >({
        mutationFn: ({ problemSetId, subtitleId }) => deleteSubtitleFromSetAPI(problemSetId, subtitleId),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`소제목 삭제 실패: ${error.message}`);
        },
    });
}