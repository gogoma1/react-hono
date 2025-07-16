import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    createEntitlementAPI, 
    addProblemsToSetAPI, 
    updateProblemSetAPI, 
    deleteProblemSetAPI, 
    deleteSubtitleFromSetAPI,
    createFolderAPI, // [신규]
    updateFolderAPI, // [신규]
    deleteFolderAPI  // [신규]
} from '../api/problemSetApi';
import type { CreateEntitlementPayload, AddProblemsToSetPayload, CreatedProblemSet, UpdateProblemSetPayload, Folder } from './types';
import { GROUPED_PROBLEM_SETS_QUERY_KEY, MY_PROBLEM_SETS_QUERY_KEY, FOLDERS_QUERY_KEY } from './useProblemSetQuery';
import { useToast } from '../../../shared/store/toastStore';

// --- Folder Mutations ---

/**
 * [신규] 폴더 생성을 위한 Mutation
 */
export function useCreateFolderMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation<Folder, Error, string>({
        mutationFn: (name) => createFolderAPI(name),
        onSuccess: (data) => {
            toast.success(`'${data.name}' 폴더가 생성되었습니다.`);
            queryClient.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`폴더 생성 실패: ${error.message}`);
        },
    });
}

/**
 * [신규] 폴더 수정을 위한 Mutation
 */
export function useUpdateFolderMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation<Folder, Error, { folderId: string; name: string }>({
        mutationFn: ({ folderId, name }) => updateFolderAPI(folderId, name),
        onSuccess: (data) => {
            toast.success(`폴더 이름이 '${data.name}'(으)로 수정되었습니다.`);
            queryClient.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
            // 폴더 이름 변경은 grouped view에도 영향을 줄 수 있음
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`폴더 수정 실패: ${error.message}`);
        },
    });
}

/**
 * [신규] 폴더 삭제를 위한 Mutation
 */
export function useDeleteFolderMutation() {
    const queryClient = useQueryClient();
    const toast = useToast();
    return useMutation<{ message: string }, Error, string>({
        mutationFn: (folderId) => deleteFolderAPI(folderId),
        onSuccess: (data) => {
            toast.info(data.message);
            queryClient.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            toast.error(`폴더 삭제 실패: ${error.message}`);
        },
    });
}

// --- ProblemSet Mutations ---

export function useCreateEntitlementMutation() {
    const toast = useToast();
    const queryClient = useQueryClient();

    return useMutation<{ success: boolean, message: string }, Error, CreateEntitlementPayload>({
        mutationFn: (payload) => createEntitlementAPI(payload),
        onSuccess: (data) => {
            toast.success(data.message || '권한이 성공적으로 설정되었습니다.');
            queryClient.invalidateQueries({ queryKey: [MY_PROBLEM_SETS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [GROUPED_PROBLEM_SETS_QUERY_KEY] });
        },
        onError: (error) => {
            console.error("권한 생성 실패:", error);
            toast.error(`권한 생성 실패: ${error.message}`);
        },
    });
}

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
            queryClient.invalidateQueries({ queryKey: [MY_PROBLEM_SETS_QUERY_KEY] });
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
            queryClient.invalidateQueries({ queryKey: [MY_PROBLEM_SETS_QUERY_KEY] });
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