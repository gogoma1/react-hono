// ./react/shared/api/api.utils.ts

export async function handleApiResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let errorBody: { message?: string; error?: string; details?: any } = { message: `API Error: ${res.status}` };
        try {
            // 백엔드가 보낸 상세 에러 JSON을 파싱합니다.
            errorBody = await res.json();
        } catch (e) {
            console.warn("API error response was not valid JSON.", { status: res.status });
        }
        
        // 새로운 Error 객체를 생성합니다.
        const errorToThrow = new Error(errorBody.message || errorBody.error || `API Error: ${res.status}`);
        
        // ✨ --- 여기가 핵심 수정 부분입니다 --- ✨
        // 생성된 Error 객체에 'details' 프로퍼티를 동적으로 추가합니다.
        // 이렇게 하면 에러 객체가 전파되어도 상세 정보가 유지됩니다.
        Object.assign(errorToThrow, { details: errorBody.details });
        // ✨ --- 여기까지 수정 --- ✨

        // 상세 정보가 포함된 에러 객체를 던집니다.
        throw errorToThrow;
    }

    if (res.status === 204) {
        return undefined as T; 
    }

    return res.json();
}