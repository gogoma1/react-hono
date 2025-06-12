// file: api/routes/example/selectpg_tables.ts

import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
// 1. Drizzle의 Raw SQL 실행을 위해 'sql' 함수를 가져옵니다.
import { sql } from 'drizzle-orm';

const exampleRoutes = new Hono<{ Bindings: Env }>();

exampleRoutes.get('/pgtables', async (c) => {
  // postgres.js를 사용한 DB 클라이언트 생성 (이 부분은 동일)
  const sqlConnection = postgres(c.env.HYPERDRIVE.connectionString, {
    max: 5,
    fetch_types: false,
  });

  try {
    // 2. postgres.js 연결로 Drizzle 클라이언트를 생성합니다.
    // Raw SQL만 실행할 경우 스키마는 전달하지 않아도 되지만,
    // 다른 쿼리와의 일관성을 위해 포함하는 것이 좋습니다.
    const db = drizzle(sqlConnection);

    // 3. db.execute()와 Drizzle의 `sql` 태그를 사용하여 Raw SQL 쿼리를 실행합니다.
    // 기존의 `sql` 변수와 이름이 겹치지 않도록 `sqlConnection`으로 변경했습니다.
    const result = await db.execute(sql`SELECT * FROM pg_tables`);


    // 연결을 정리합니다.
    c.executionCtx.waitUntil(sqlConnection.end());

    // 결과를 JSON으로 반환합니다.
    return c.json({ success: true, result });
  } catch (e: any) {
    console.error('Database error:', e.message);
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default exampleRoutes;