import { Hono } from 'hono';
import type { AppEnv } from '../../index'; // 메인 index.ts의 AppEnv 타입을 가져옵니다.

// Hono 앱 인스턴스 생성. AppEnv를 제네릭으로 전달하여 타입 안정성 확보
const r2ImageRoutes = new Hono<AppEnv>();

/**
 * POST /api/r2/upload - 이미지 파일을 R2에 업로드
 * Supabase 미들웨어에 의해 인증된 사용자만 접근 가능합니다.
 */
r2ImageRoutes.post('/upload', async (c) => {
    // 1. 인증된 사용자 정보 가져오기 (auth.middleware.ts에서 설정됨)
    const user = c.get("user");
    if (!user) {
        // 미들웨어가 어떤 이유로든 실패한 경우를 대비한 방어 코드
        return c.json({ error: "인증되지 않은 사용자입니다." }, 401);
    }

    // 2. 환경 변수에서 R2 버킷과 공개 URL 가져오기
    const bucket = c.env.MY_R2_BUCKET;
    const publicUrlBase = c.env.R2_PUBLIC_URL; // "R2_PUBLIC_URL" 사용

    if (!bucket) {
        console.error('R2 버킷 바인딩(MY_R2_BUCKET)이 설정되지 않았습니다.');
        return c.json({ error: '서버 설정 오류: R2 버킷을 찾을 수 없습니다.' }, 500);
    }
    if (!publicUrlBase) {
        console.error('R2_PUBLIC_URL 환경 변수가 설정되지 않았습니다.');
        return c.json({ error: '서버 설정 오류: R2 공개 URL을 찾을 수 없습니다.' }, 500);
    }

    try {
        // 3. 요청에서 파일 데이터 파싱 및 유효성 검사
        const formData = await c.req.formData();
        const file = formData.get('file');

        if (!file || !(file instanceof File)) {
            return c.json({ error: '파일이 요청에 포함되지 않았거나 올바른 파일 형식이 아닙니다.' }, 400);
        }
        
        // 파일 유효성 검사 (크기, 타입)
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxFileSize) {
            return c.json({ error: `파일 크기는 ${maxFileSize / 1024 / 1024}MB를 초과할 수 없습니다.` }, 413);
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return c.json({ error: '허용되지 않는 이미지 파일 형식입니다. (JPEG, PNG, GIF, WEBP 허용)' }, 415);
        }
        
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension) {
            return c.json({ error: '파일 확장자를 확인할 수 없습니다.' }, 400);
        }

        // 4. R2에 파일 업로드 (crypto.randomUUID() 사용)
        const uniqueKey = `${crypto.randomUUID()}.${fileExtension}`;
        await bucket.put(uniqueKey, file.stream(), {
            httpMetadata: { contentType: file.type },
            customMetadata: { userId: user.id } // ⭐ 중요: 파일 소유자 ID를 메타데이터에 저장
        });

        console.log(`사용자 ${user.id}가 파일 업로드 성공: ${uniqueKey}`);

        // 5. 성공 응답으로 파일 URL 반환
        const separator = publicUrlBase.endsWith('/') ? '' : '/';
        const fileUrl = `${publicUrlBase}${separator}${uniqueKey}`;

        return c.json({
            message: '파일 업로드 성공',
            key: uniqueKey, // 클라이언트가 나중에 삭제 요청 시 사용할 키
            url: fileUrl,
        }, 201);

    } catch (error: unknown) {
        console.error('파일 업로드 중 오류:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return c.json({ error: `파일 업로드 중 오류가 발생했습니다: ${errorMessage}` }, 500);
    }
});

/**
 * DELETE /api/r2/delete - R2 객체 삭제
 * 요청 본문에 { "key": "..." } 형식으로 삭제할 파일의 키를 포함해야 합니다.
 */
r2ImageRoutes.delete('/delete', async (c) => {
    // 1. 인증된 사용자 확인
    const user = c.get("user");
    if (!user) {
        return c.json({ error: "인증되지 않은 사용자입니다." }, 401);
    }
    
    // 2. R2 버킷 확인
    const bucket = c.env.MY_R2_BUCKET;
    if (!bucket) {
        return c.json({ error: '서버 설정 오류: R2 버킷을 찾을 수 없습니다.' }, 500);
    }

    try {
        // 3. 요청 본문에서 삭제할 파일 키(key) 파싱
        const { key: keyToDelete } = await c.req.json<{ key: string }>();
        if (!keyToDelete || typeof keyToDelete !== 'string') {
            return c.json({ error: "요청 본문에 유효한 'key' 속성(문자열)이 필요합니다." }, 400);
        }

        // 4. ⭐ 중요: 객체 소유권 확인 후 삭제
        const headResult = await bucket.head(keyToDelete);

        if (!headResult) {
            // 이미 삭제되었거나 잘못된 키일 수 있음. 클라이언트 입장에서 실패는 아니므로 200 OK도 가능.
            return c.json({ message: '삭제할 객체를 찾을 수 없거나 이미 삭제되었습니다.' }, 404);
        }

        // customMetadata에 저장된 userId와 현재 요청자의 user.id를 비교
        if (headResult.customMetadata?.userId !== user.id) {
            console.warn(`권한 없는 삭제 시도: 사용자 ${user.id}가 ${headResult.customMetadata?.userId} 소유의 키 ${keyToDelete} 삭제 시도`);
            return c.json({ error: '이 객체를 삭제할 권한이 없습니다.' }, 403); // 403 Forbidden
        }

        // 5. 소유권 확인 후 객체 삭제
        await bucket.delete(keyToDelete);
        console.log(`사용자 ${user.id}가 객체 삭제 성공: ${keyToDelete}`);

        return c.json({ message: '객체가 성공적으로 삭제되었습니다.' }, 200);

    } catch (error: unknown) {
        console.error('객체 삭제 중 오류 발생:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        return c.json({ error: `객체 삭제 중 오류가 발생했습니다: ${errorMessage}` }, 500);
    }
});


export default r2ImageRoutes;