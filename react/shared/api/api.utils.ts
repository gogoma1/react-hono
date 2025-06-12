
// 공통 응답 처리 함수
export async function handleApiResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let errorBody: { message?: string; error?: string; details?: any } = { message: `API Error: ${res.status}` };
        try { errorBody = await res.json(); } catch (e) { /* no-op */ }
        throw new Error(errorBody.message || errorBody.error || `API Error: ${res.status}`);
    }
    if (res.status === 204) { // No Content case 추가
        return undefined as T;
    }
    return res.json();
}

