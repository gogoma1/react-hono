export async function handleApiResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let errorBody: { message?: string; error?: string; details?: any } = { message: `API Error: ${res.status} ${res.statusText}` };
        try {
            errorBody = await res.json();
            // [개선] Zod 오류인 경우, 더 상세한 정보를 콘솔에 출력
            if (errorBody.error && typeof errorBody.error === 'object') {
                console.error("🔥 Detailed Zod Validation Error:", errorBody.error);
            }
        } catch (e) {
            console.warn("API error response was not valid JSON.", { status: res.status });
        }
        
        const errorToThrow = new Error(errorBody.message || errorBody.error?.toString() || `API Error: ${res.status}`);
        
        // 에러 객체에 상세 정보 포함
        Object.assign(errorToThrow, { details: errorBody.details || errorBody.error });

        throw errorToThrow;
    }

    if (res.status === 204) {
        return undefined as T; 
    }

    return res.json();
}