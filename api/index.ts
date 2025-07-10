import { Hono } from 'hono';
import { cors } from 'hono/cors';

import profileRoutes from './routes/profiles/profiles';
import studentRoutes from './routes/manage/student';
import teacherRoutes from './routes/manage/teacher';
import permissionRoutes from './routes/manage/permissions';
import { supabaseMiddleware } from './routes/middleware/auth.middleware';
import problemRoutes from './routes/manage/problems';
import r2ImageRoutes from './routes/r2/image';
// [수정] exam 폴더의 index.ts에서 통합된 라우트를 가져옵니다.
import examRoutes from './routes/exam';
import academyRoutes from './routes/manage/academies';

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

app.use(supabaseMiddleware());

app.route('/profiles', profileRoutes); 
app.route('/manage/student', studentRoutes);
app.route('/manage/teacher', teacherRoutes);
app.route('/manage/permissions', permissionRoutes);
app.route('/manage/problems', problemRoutes); 
app.route('/r2', r2ImageRoutes);
app.route('/academies', academyRoutes);

// [수정] '/exams'라는 일관된 경로로 통합된 라우트를 등록합니다.
app.route('/exams', examRoutes); 

app.get('/', (c) => c.text('Hono API is running!'));

export default app;