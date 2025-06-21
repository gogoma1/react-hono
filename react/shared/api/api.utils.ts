export async function handleApiResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        // 에러 응답 처리 로직은 기존과 동일
        let errorBody: { message?: string; error?: string; details?: any } = { message: `API Error: ${res.status}` };
        try {
            // 에러 응답에도 본문이 없을 수 있으므로 try-catch로 감쌉니다.
            errorBody = await res.json();
        } catch (e) {
            // JSON 파싱 실패 시, 상태 코드로 에러 메시지를 생성합니다.
            console.warn("API error response was not valid JSON.", { status: res.status });
        }
        throw new Error(errorBody.message || errorBody.error || `API Error: ${res.status}`);
    }

    // ⭐ 핵심 수정: 204 No Content 상태 코드를 먼저 확인합니다.
    if (res.status === 204) {
        // 본문이 없으므로, undefined를 반환하여 .json() 호출을 피합니다.
        // 호출하는 쪽(예: deleteImageAPI)의 반환 타입이 Promise<void>이므로 문제 없습니다.
        return undefined as T; 
    }

    // 204가 아닌 다른 성공 응답(200, 201 등)은 JSON 본문을 가집니다.
    return res.json();
}