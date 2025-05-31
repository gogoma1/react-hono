// react-hono/api/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors'; // CORS 추가
import { supabaseMiddleware } from './routes/middleware/auth.middleware';
import authApiRoutes from './routes/auth/auth'; // 분리된 인증/데이터 관련 API 라우트
import exampleRoute from './routes/example/selectpg_tables'; // 분리된 example 라우트

// Env 타입은 auth.middleware.ts에서 전역 선언된 것을 사용
const app = new Hono<{ Bindings: Env }>();

// 1. CORS 미들웨어 (요청 처리 시작 부분에 적용)
app.use('*', cors({
  origin: '*', // 로컬 테스트용. 프로덕션에서는 특정 도메인으로 제한
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'Apikey', /* 기존 사용 헤더 */],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true, // Supabase 쿠키 인증에 필요할 수 있음
}));


// 2. Supabase 미들웨어 (기존 코드와 동일하게 '*'에 적용)
app.use('*', supabaseMiddleware());


// 3. 라우트 등록
// '/api' 접두사 없이 라우트를 authApiRoutes 내부 경로에 직접 매칭
// 예: authApiRoutes의 /user -> /user
// authApiRoutes의 /signin -> /signin
// 이렇게 하려면 authApiRoutes 내부 경로가 '/api/user' 형태가 아니어야 함.
// 또는, index.ts에서 접두사를 붙여준다.

// 기존 코드에서 app.get('/api/user', ...) 와 같이 직접 정의했으므로,
// authApiRoutes도 해당 경로들을 그대로 가지도록 하고, app.route로 묶어준다.
// authApiRoutes는 /user, /signin, /signout, /countries를 가짐.
// 이들을 /api 접두사 아래로 라우팅 하려면:
// app.route('/api', authApiRoutes);
// 하지만, 기존 코드는 /api/user 가 아닌 /user, /signin 등으로 바로 접근하고 있었음.
// 그 구조를 유지하면서 정리하려면:
app.route('/', authApiRoutes); // authApiRoutes의 /user, /signin 등을 최상위 경로로 등록

// 기존 app.route('/example', exampleSelectPgTablesRoute) 유지
app.route('/example', exampleRoute); // exampleRoute는 /pg-tables를 가짐 -> /example/pg-tables

// 4. AppType export (기존 로직 유지)
// 기존 코드에서는 const routes = app.get(...) 이후 export type AppType = typeof routes; 였음.
// 이 방식은 단일 GET 라우트의 타입만 export하게 됨.
// 전체 app 인스턴스의 타입을 export하는 것이 더 일반적임.
// 클라이언트에서 hc<AppType>('/') 로 사용.

// export type AppType = typeof app; // 모든 라우트와 미

export default app;