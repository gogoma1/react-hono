import { handleApiResponse } from '../../../shared/api/api.utils';

const API_BASE_UPLOAD = '/api/r2/upload';
const API_BASE_DELETE = '/api/r2/delete';

export interface UploadResponse {
    url: string;
    key: string;
}

/**
 * 이미지 파일을 서버에 업로드합니다.
 * @param file - 업로드할 이미지 파일
 * @returns 업로드된 이미지의 URL과 키
 */
export const uploadImageAPI = async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(API_BASE_UPLOAD, {
        method: 'POST',
        body: formData,
        credentials: 'include', // 세션/쿠키 인증을 위해 필요
    });
    return handleApiResponse<UploadResponse>(res);
};

/**
 * 서버에서 특정 키를 가진 이미지를 삭제합니다.
 * @param key - 삭제할 이미지의 키
 */
export const deleteImageAPI = async (key: string): Promise<void> => {
    const res = await fetch(API_BASE_DELETE, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key }),
    });
    // handleApiResponse는 204 No Content도 처리합니다.
    await handleApiResponse<void>(res);
};