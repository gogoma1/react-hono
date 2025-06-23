// react/entities/problem/model/useProblemMutations.ts

import { useMutation } from '@tanstack/react-query';
import { uploadProblemsAPI } from '../api/problemApi';
import type { Problem } from './types';

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