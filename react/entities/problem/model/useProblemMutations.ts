import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProblemsAPI, updateProblemAPI, deleteProblemsAPI } from '../api/problemApi';
import type { Problem } from './types';
import { PROBLEMS_QUERY_KEY } from './useProblemsQuery';

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
 * 단일/다중 문제 영구 삭제를 위한 React Query Mutation
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
 * 문제 업로드(생성/수정)를 위한 React Query Mutation
 */
export function useUploadProblemsMutation() {
    const queryClient = useQueryClient();
    return useMutation<UploadResponse, Error, Problem[]>({
        mutationFn: (problems) => uploadProblemsAPI(problems),
        // [수정] 성공 시 더 상세한 메시지 표시 및 데이터 갱신
        onSuccess: (data) => {
            let message = "작업이 완료되었습니다.";
            if (data.created > 0 && data.updated > 0) {
                message = `${data.created}개의 문제가 생성되었고, ${data.updated}개의 문제가 업데이트되었습니다.`;
            } else if (data.created > 0) {
                message = `${data.created}개의 문제가 성공적으로 생성되었습니다.`;
            } else if (data.updated > 0) {
                message = `${data.updated}개의 문제가 성공적으로 업데이트되었습니다.`;
            }
            alert(message);
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
        },
        onError: (error) => {
            alert(`문제 업로드 실패: ${error.message}`);
            console.error('Upload failed:', error);
        },
    });
}