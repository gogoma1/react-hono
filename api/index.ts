// ./api/index.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';

import profileRoutes from './routes/profiles/profiles';
import studentRoutes from './routes/manage/student';
import teacherRoutes from './routes/manage/teacher';
import permissionRoutes from './routes/manage/permissions';
import { supabaseMiddleware } from './routes/middleware/auth.middleware';
import problemRoutes from './routes/manage/problems';
import r2ImageRoutes from './routes/r2/image';
import examRoutes from './routes/exam';
import academyRoutes from './routes/manage/academies';
import folderRoutes from './routes/manage/folders';

// [핵심 수정 1] 새로 만든 problem-sets 라우트를 import 합니다.
import problemSetRoutes from './routes/manage/problem-sets';

export type AppEnv = {
    Bindings: Env;
    Variables: {
        supabase: import('@supabase/supabase-js').SupabaseClient;
        user: import('@supabase/supabase-js').User;
        session: import('@supabase/supabase-js').Session;
    }
}

const app = new Hono<AppEnv>().basePath('/api');

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

// supabaseMiddleware는 모든 라우트 등록 전에 위치하는 것이 좋습니다.
app.use(supabaseMiddleware());

// API 라우트 등록
app.route('/profiles', profileRoutes); 
app.route('/manage/student', studentRoutes);
app.route('/manage/teacher', teacherRoutes);
app.route('/manage/permissions', permissionRoutes);
app.route('/manage/problems', problemRoutes); 
app.route('/r2', r2ImageRoutes);
app.route('/academies', academyRoutes);
app.route('/exams', examRoutes); 

app.route('/manage/folders', folderRoutes);
app.route('/manage/problem-sets', problemSetRoutes);

app.get('/', (c) => c.text('Hono API is running!'));

export default app;