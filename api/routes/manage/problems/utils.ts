// ./api/routes/manage/problems/utils.ts

/**
 * 주어진 텍스트에서 R2 공개 URL을 찾아 이미지 키 목록을 추출합니다.
 * 마크다운 형식의 이미지 링크 `![](<URL>)`를 파싱합니다.
 * @param text - 파싱할 텍스트 (예: question_text)
 * @param r2PublicUrl - wrangler.toml에 정의된 R2 공개 URL
 * @returns 추출된 이미지 키의 배열 (중복 제거됨)
 */
export function extractImageKeysFromText(text: string | null, r2PublicUrl: string): string[] {
    if (!text || !r2PublicUrl) {
        return [];
    }
    
    // 정규표현식을 사용하여 마크다운 이미지 링크에서 URL을 찾습니다.
    // ![]() 형식의 URL을 추출합니다.
    const urlRegex = /!\[.*?\]\((https?:\/\/[^\s)]+)\)/g;
    
    // text에서 정규식과 일치하는 모든 부분을 찾습니다. matchAll은 이터레이터를 반환합니다.
    const matches = text.matchAll(urlRegex);
    
    // 각 매칭 결과에서 URL 부분(첫 번째 캡처 그룹)만 추출합니다.
    const urls = [...matches].map(match => match[1]);

    const keys = urls
        // 우리 R2 버킷의 URL인지 확인합니다.
        .filter(url => url.startsWith(r2PublicUrl))
        // URL에서 R2 공개 URL 부분을 제거하여 key만 남깁니다.
        // 예: "https://.../key.png" -> "key.png"
        .map(url => url.substring(r2PublicUrl.length).replace(/^\//, ''));

    // 중복된 키가 있을 수 있으므로 Set을 사용하여 유니크한 키만 반환합니다.
    return [...new Set(keys)];
}