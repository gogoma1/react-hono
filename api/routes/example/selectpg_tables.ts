import { Hono } from 'hono';
import postgres from 'postgres';

// Env 타입을 가져옵니다. (worker-configuration.d.ts 에서 정의될 예정)
// 또는 여기서 직접 정의할 수도 있지만, 전역적으로 관리하는 것이 좋습니다.
// 예: type AppEnv = { Bindings: Env }

const exampleRoutes = new Hono<{ Bindings: Env }>(); // Hono에 Env 타입 바인딩

exampleRoutes.get('/pg-tables', async (c) => {
  // Create a database client that connects to your database via Hyperdrive
  // using the Hyperdrive credentials
  const sql = postgres(c.env.HYPERDRIVE.connectionString, {
    // Limit the connections for the Worker request to 5 due to Workers' limits on concurrent external connections
    max: 5,
    // If you are not using array types in your Postgres schema, disable `fetch_types` to avoid an additional round-trip (unnecessary latency)
    fetch_types: false,
  });

  try {
    // A very simple test query
    const result = await sql`SELECT * FROM pg_tables`; // SQL 쿼리 수정 (pg_tables는 보통 스키마 지정 필요 없음)

    // Clean up the client, ensuring we don't kill the worker before that is
    // completed.
    c.executionCtx.waitUntil(sql.end());

    // Return result rows as JSON
    return c.json({ success: true, result: result });
  } catch (e: any) {
    console.error('Database error:', e.message);
    // Hono에서는 c.json으로 에러 응답을 보내는 것이 일반적입니다.
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default exampleRoutes;