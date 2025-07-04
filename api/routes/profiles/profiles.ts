import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm'; // [수정] sql 임포트 제거
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// ... (다른 Zod 스키마 및 라우트 초기화 코드는 그대로) ...
const POSITIONS = ['학생', '원장', '강사', '학부모'] as const;

const profileSetupSchema = z.object({
  name: z.string().min(1, "이름은 필수 항목입니다.").max(100),
  position: z.enum(POSITIONS),
  academyName: z.string().min(1, "학원 이름은 필수 항목입니다.").max(150),
  region: z.string().min(1, "지역은 필수 항목입니다.").max(100),
});


const profileRoutes = new Hono<AppEnv>();


// --- [핵심 수정] 학원 목록 조회 API ---
profileRoutes.get('/academies', async (c) => {
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        // `selectDistinct`를 사용하여 'academy_name'과 'region'의 고유한 조합을 가져옵니다.
        // 이것이 SQL의 `SELECT DISTINCT academy_name, region FROM ...`와 동일한 역할을 합니다.
        const academies = await db
            .selectDistinct({
                academyName: schema.profilesTable.academy_name,
                region: schema.profilesTable.region,
            })
            .from(schema.profilesTable)
            .where(eq(schema.profilesTable.position, '원장'));
        
        // 정렬은 DB에서 가져온 후, 애플리케이션 레벨에서 수행합니다.
        // 데이터 양이 많지 않으므로 성능에 큰 영향을 주지 않습니다.
        academies.sort((a, b) => a.academyName.localeCompare(b.academyName));
        
        return c.json(academies);

    } catch (error: any) {
        console.error('Failed to fetch academies:', error.message);
        return c.json({ error: '학원 목록 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});


// ... (기존 /exists 및 /setup 라우트는 그대로 유지) ...
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
  
  
  profileRoutes.post(
    '/setup',
    zValidator('json', profileSetupSchema, (result, c) => {
      if (!result.success) {
        console.error('Validation failed:', result.error.flatten());
        return c.json({ error: 'Invalid input', details: result.error.flatten().fieldErrors }, 400);
      }
    }),
    async (c) => {
      const user = c.get('user');
      const { name, position, academyName, region } = c.req.valid('json');
  
      if (!user?.id || !user?.email) {
        return c.json({ error: 'Authentication required' }, 401);
      }
      
      const sql = postgres(c.env.HYPERDRIVE.connectionString);
      const db = drizzle(sql, { schema });
  
      try {
        const newProfile = await db.insert(schema.profilesTable).values({
          id: user.id,
          email: user.email,
          name: name,
          position: position,
          academy_name: academyName,
          region: region,
        })
        .returning({
          insertedId: schema.profilesTable.id 
        });
  
        if (newProfile.length === 0) {
          throw new Error('Profile insertion failed, no data returned.');
        }
        
        console.log(`New profile created for user: ${newProfile[0].insertedId}`);
  
        return c.json({ success: true, profileId: newProfile[0].insertedId }, 201);
  
      } catch (error: any) {
        console.error('Failed to create profile:', error.message);
        if (error.code === '23505') {
          return c.json({ error: 'Profile for this user already exists.' }, 409);
        }
        return c.json({ error: 'Database query failed' }, 500);
      } finally {
        c.executionCtx.waitUntil(sql.end());
      }
    }
  );

export default profileRoutes;