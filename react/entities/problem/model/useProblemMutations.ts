import { useMutation, useQueryClient } from '@tanstack/react-query';
// [수정] updateProblemAPI 함수를 import 합니다.
import { uploadProblemsAPI, updateProblemAPI } from '../api/problemApi';
import type { Problem } from './types';
// [수정] 'problems' 쿼리 키를 import 합니다.
import { PROBLEMS_QUERY_KEY } from './useProblemsQuery';

// [추가] 업데이트 뮤테이션을 위한 변수 타입을 정의합니다.
interface UpdateProblemVariables {
  id: string | number;
  fields: Partial<Problem>;
}

/**
 * [추가] 문제 수정을 위한 React Query Mutation
 * 이 훅을 새로 추가하고 export 합니다.
 */
export function useUpdateProblemMutation() {
    const queryClient = useQueryClient();
    return useMutation<Problem, Error, UpdateProblemVariables>({
        // mutationFn은 API 호출 함수를 실행합니다.
        mutationFn: (variables) => updateProblemAPI(variables.id, variables.fields),
        
        // API 호출이 성공했을 때 실행됩니다.
        onSuccess: (updatedProblem) => {
            // "쿼리 무효화"는 'problems' 쿼리를 오래된 것으로 표시하여
            // React Query가 데이터를 자동으로 다시 가져오게 하는 가장 안정적인 방법입니다.
            queryClient.invalidateQueries({ queryKey: [PROBLEMS_QUERY_KEY] });
            
            // 또는, setQueryData로 캐시를 직접 수정하여 더 빠른 UI 반응을 만들 수도 있습니다.
            // queryClient.setQueryData<Problem[]>([PROBLEMS_QUERY_KEY], (oldData = []) => 
            //     oldData.map(p => p.question_number === updatedProblem.question_number ? updatedProblem : p)
            // );
        },
        
        // API 호출이 실패했을 때 실행됩니다.
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