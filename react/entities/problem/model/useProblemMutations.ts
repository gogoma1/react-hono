import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadProblemsAPI, updateProblemAPI } from '../api/problemApi';
import type { Problem } from './types';
import { PROBLEMS_QUERY_KEY } from './useProblemsQuery';

interface UpdateProblemVariables {
  id: string; // [수정] ID는 항상 string (UUID)
  fields: Partial<Problem>;
}

/**
 * [수정] 문제 수정을 위한 React Query Mutation
 */
export function useUpdateProblemMutation() {
    const queryClient = useQueryClient();
    return useMutation<Problem, Error, UpdateProblemVariables>({
        mutationFn: (variables) => updateProblemAPI(variables.id, variables.fields),
        
        // 성공 시, 문제 목록 쿼리를 무효화하여 최신 데이터로 갱신
        onSuccess: (updatedProblem) => {
            // [방법 1] 쿼리 무효화 (가장 간단하고 일반적)
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });

            // [방법 2] 낙관적 업데이트 없이 쿼리 데이터 직접 수정 (더 빠름)
            // queryClient.setQueryData<Problem[]>([PROBLEMS_QUERY_KEY], (oldData = []) =>
            //     oldData.map(p => p.problem_id === updatedProblem.problem_id ? updatedProblem : p)
            // );
            alert('문제가 성공적으로 저장되었습니다.');
        },
        
        onError: (error) => {
            alert(`문제 업데이트 실패: ${error.message}`);
            console.error('Update failed:', error);
        },
    });
}

/**
 * 문제 업로드를 위한 React Query Mutation
 */
export function useUploadProblemsMutation() {
    return useMutation<unknown, Error, Problem[]>({
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