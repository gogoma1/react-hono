// filepath: api/index.ts (최종 수정 버전)

import { Hono } from 'hono';
import { cors } from 'hono/cors';

// --- 라우트 파일 import ---
import profileRoutes from './routes/profiles/profiles';
import studentRoutes from './routes/manage/student';
import { supabaseMiddleware } from './routes/middleware/auth.middleware';
import problemRoutes from './routes/manage/problems';
import r2ImageRoutes from './routes/r2/image';
import examRoutes from './routes/exam/examlogs';
import mobileExamRoutes from './routes/exam/exam.mobile';
import academyRoutes from './routes/manage/academies';

// --- Hono 앱 타입 정의 (AppEnv) ---
export type AppEnv = {
    Bindings: Env;
    Variables: {
        supabase: import('@supabase/supabase-js').SupabaseClient;
        user: import('@supabase/supabase-js').User;
        session: import('@supabase/supabase-js').Session;
    }
}

const app = new Hono<AppEnv>().basePath('/api');

// --- 미들웨어 등록 ---
// CORS 미들웨어는 모든 경로에 적용해도 안전합니다.
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = ['http://localhost:5173', 'https://your-production-domain.com'];
    if (allowedOrigins.includes(origin)) return origin;
    return null;
  },
  allowHeaders: ['Content-Type', 'Authorization', 'X-Client-Info', 'Apikey'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(supabaseMiddleware());

// --- API 라우트 등록 ---
app.route('/profiles', profileRoutes); 
app.route('/manage/student', studentRoutes);
app.route('/manage/problems', problemRoutes); 
app.route('/r2', r2ImageRoutes);

app.route('/exam', examRoutes);
app.route('/academies', academyRoutes);

app.route('/exam/mobile', mobileExamRoutes); 



app.get('/', (c) => c.text('Hono API is running!'));

export default app;