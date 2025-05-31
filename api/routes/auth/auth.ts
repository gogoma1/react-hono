// react-hono/api/routes/auth/auth.ts
import { Hono } from 'hono';
import { getSupabase } from '../middleware/auth.middleware'; // 경로가 맞는지 확인

// Env, SupabaseVariables 타입은 auth.middleware.ts 또는 전역에 선언된 것을 사용
const authApiRoutes = new Hono<{ Bindings: Env; Variables: { supabase: any } }>();

// --- 기존 /api/user 로직 ---
const routes = authApiRoutes.get('/user', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.getUser();

  if (error) console.log('error', error);

  if (!data?.user) {
    return c.json({
      message: 'You are not logged in.',
    });
  }

  return c.json({
    message: 'You are logged in!',
    userId: data.user, // 기존 로직 유지 (userId: data.user)
  });
});

// --- 기존 /signin 로직 ---
authApiRoutes.get('/signin', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `/`, // 기존 로직 유지
    },
  });

  if (error) {
    console.error('Sign-in error:', error);
    return c.json({ error: 'Sign-in failed' }, 500);
  }

  console.log('Redirecting to kakao for sign-in...');
  return c.redirect(data.url);
});

// --- 기존 /signout 로직 ---
authApiRoutes.get('/signout', async (c) => {
  const supabase = getSupabase(c);
  await supabase.auth.signOut();
  console.log('Signed out server-side!');
  return c.redirect('/'); // 기존 로직 유지
});

// --- 기존 /countries 로직 ---
authApiRoutes.get('/countries', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('countries').select('*');
  if (error) console.log(error);
  return c.json(data); // 기존 로직 유지
});

export default authApiRoutes;

export type AppType = typeof routes; // 전체 라우트 타입 export