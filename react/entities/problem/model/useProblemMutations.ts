import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProblemsAPI, updateProblemAPI, deleteProblemsAPI } from '../api/problemApi';
import type { Problem } from './types';
import { PROBLEMS_QUERY_KEY } from './useProblemsQuery';

// [수정] uploadProblemsAPI의 반환 타입을 명시적으로 가져옴
import type { UploadResponse } from '../api/problemApi';

interface UpdateProblemVariables {
  id: string; 
  fields: Partial<Problem>;
}

/**
 * 문제 수정을 위한 React Query Mutation
 */
export function useUpdateProblemMutation() {
    const queryClient = useQueryClient();
    return useMutation<Problem, Error, UpdateProblemVariables>({
        mutationFn: (variables) => updateProblemAPI(variables.id, variables.fields),
        onSuccess: (_updatedProblem) => {
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
        },
        onError: (error) => {
            alert(`문제 업데이트 실패: ${error.message}`);
            console.error('Update failed:', error);
        },
    });
}

/**
 * [수정] 단일/다중 문제 영구 삭제를 위한 React Query Mutation
 * (기존 useDeleteProblemMutation을 이 훅으로 통합)
 */
export function useDeleteProblemsMutation() {
    const queryClient = useQueryClient();
    return useMutation<{ message: string, deleted_count: number }, Error, string[]>({
        mutationFn: (problemIds) => deleteProblemsAPI(problemIds),
        
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
            alert(data.message || '문제가 삭제되었습니다.');
        },
        
        onError: (error) => {
            alert(`문제 삭제 실패: ${error.message}`);
            console.error('Problem delete failed:', error);
        },
    });
}

/**
 * 문제 업로드를 위한 React Query Mutation
 */
export function useUploadProblemsMutation() {
    // [수정] 제네릭의 unknown을 UploadResponse로 변경
    return useMutation<UploadResponse, Error, Problem[]>({
        mutationFn: (problems) => uploadProblemsAPI(problems),
        onSuccess: () => {
            alert('문제가 성공적으로 업로드되었습니다.');
        },
        onError: (error) => {
            alert(`문제 업로드 실패: ${error.message}`);
            console.error('Upload failed:', error);
        },
    });
}