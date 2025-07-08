import { Hono } from 'hono';
import { cors } from 'hono/cors';

import profileRoutes from './routes/profiles/profiles';
import studentRoutes from './routes/manage/student';
import teacherRoutes from './routes/manage/teacher';         // [신규] 강사 라우트 import
import permissionRoutes from './routes/manage/permissions';     // [신규] 권한 라우트 import
import { supabaseMiddleware } from './routes/middleware/auth.middleware';
import problemRoutes from './routes/manage/problems';
import r2ImageRoutes from './routes/r2/image';
import examRoutes from './routes/exam/examlogs';
import mobileExamRoutes from './routes/exam/exam.mobile';
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
app.route('/manage/teacher', teacherRoutes);         // [신규] 강사 라우트 등록
app.route('/manage/permissions', permissionRoutes);     // [신규] 권한 라우트 등록
app.route('/manage/problems', problemRoutes); 
app.route('/r2', r2ImageRoutes);

app.route('/exam', examRoutes);
app.route('/academies', academyRoutes);

app.route('/exam/mobile', mobileExamRoutes); 

app.get('/', (c) => c.text('Hono API is running!'));

export default app;