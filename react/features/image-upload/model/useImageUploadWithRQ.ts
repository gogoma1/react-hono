import { useMutation } from '@tanstack/react-query';
import { uploadImageAPI, deleteImageAPI, type UploadResponse } from '../api/imageApi';

/**
 * 이미지 업로드를 위한 React Query Mutation
 */
export function useUploadImageMutation() {
    return useMutation<UploadResponse, Error, File>({
        mutationFn: (file) => uploadImageAPI(file),
        // onSuccess, onError 등은 사용하는 컴포넌트에서 직접 처리하는 것이 더 유연함
    });
}

/**
 * 이미지 삭제를 위한 React Query Mutation
 */
export function useDeleteImageMutation() {
    return useMutation<void, Error, string>({
        mutationFn: (key) => deleteImageAPI(key),
    });
}