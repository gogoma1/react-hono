import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator'; // Zod 유효성 검사기 import

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg'; // 스키마 전체를 가져옵니다.

// --- 상수 및 Zod 스키마 정의 ---
// 프론트엔드와 일관성을 유지합니다.
const POSITIONS = ['학생', '원장', '강사', '학부모'] as const;

// POST /setup 요청의 body를 검증할 Zod 스키마
const profileSetupSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  position: z.enum(POSITIONS),
  // 프론트엔드에서는 camelCase(academyName)로 보내지만, DB 스키마는 snake_case(academy_name)를 따릅니다.
  // transform을 사용하여 데이터를 변환해줍니다.
  academyName: z.string().min(1, "학원 이름은 필수 항목입니다.").max(150),
  region: z.string().min(1, "지역은 필수 항목입니다.").max(100),
});


const profileRoutes = new Hono<AppEnv>();

// --- 기존 GET /exists 라우트 ---
profileRoutes.get('/exists', async (c) => {
  const user = c.get('user');

  if (!user?.id) {
    return c.json({ success: false, error: 'Authentication required' }, 401);
  }

  const sql = postgres(c.env.HYPERDRIVE.connectionString);
  const db = drizzle(sql, { schema });

  try {
    const profile = await db.query.profilesTable.findFirst({
      where: eq(schema.profilesTable.id, user.id),
      columns: { id: true },
    });
    return c.json({ success: true, exists: !!profile });
  } catch (error: any) {
    console.error('Failed to check profile existence:', error.message);
    return c.json({ success: false, error: 'Database query failed' }, 500);
  } finally {
    c.executionCtx.waitUntil(sql.end());
  }
});


// --- ▼▼▼ 새로 추가된 POST /setup 라우트 ▼▼▼ ---
profileRoutes.post(
  '/setup',
  // 1. Zod 유효성 검사 미들웨어: 요청 body가 profileSetupSchema를 따르는지 검사합니다.
  //    검사에 실패하면 자동으로 400 Bad Request 에러를 반환합니다.
  zValidator('json', profileSetupSchema, (result, c) => {
    if (!result.success) {
      console.error('Validation failed:', result.error.flatten());
      // Zod가 생성한 상세 에러 메시지를 클라이언트에 전달
      return c.json({ error: 'Invalid input', details: result.error.flatten().fieldErrors }, 400);
    }
  }),
  // 2. 유효성 검사를 통과한 경우에만 이 핸들러가 실행됩니다.
  async (c) => {
    const user = c.get('user');
    // zValidator를 통과한 데이터는 c.req.valid('json')으로 안전하게 가져올 수 있습니다.
    const { name, position, academyName, region } = c.req.valid('json');

    // 인증된 사용자인지 다시 한번 확인 (필수)
    if (!user?.id || !user?.email) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
      // 3. Drizzle ORM을 사용하여 'profiles' 테이블에 데이터를 삽입합니다.
      const newProfile = await db.insert(schema.profilesTable).values({
        id: user.id, // 인증된 사용자의 UUID
        email: user.email, // 인증된 사용자의 이메일
        name: name,
        position: position,
        academy_name: academyName, // 프론트의 camelCase를 DB의 snake_case에 매핑
        region: region,
      })
      .returning({ // 삽입된 데이터 중 id를 반환받아 확인
        insertedId: schema.profilesTable.id 
      });

      // 삽입이 성공적으로 이루어졌는지 확인
      if (newProfile.length === 0) {
        throw new Error('Profile insertion failed, no data returned.');
      }
      
      console.log(`New profile created for user: ${newProfile[0].insertedId}`);

      // 4. 성공 응답을 반환합니다.
      return c.json({ success: true, profileId: newProfile[0].insertedId }, 201); // 201 Created 상태 코드 사용

    } catch (error: any) {
      console.error('Failed to create profile:', error.message);
      // 데이터베이스 제약 조건 위반 (예: 이미 존재하는 id) 등의 에러 처리
      if (error.code === '23505') { // PostgreSQL unique_violation 에러 코드
        return c.json({ error: 'Profile for this user already exists.' }, 409); // 409 Conflict
      }
      return c.json({ error: 'Database query failed' }, 500);
    } finally {
      c.executionCtx.waitUntil(sql.end());
    }
  }
);


export default profileRoutes;