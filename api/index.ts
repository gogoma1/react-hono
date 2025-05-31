//file path: react-hono/api/index.ts

import { Hono } from 'hono';
import { getSupabase, supabaseMiddleware } from './routes/middleware/auth.middleware';
import exampleSelectPgTablesRoute from './routes/example/selectpg_tables';

const app = new Hono<{Bindings: Env}>();
app.use('*', supabaseMiddleware());

const routes = app.get('/api/user', async (c) => {
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
    userId: data.user,
  });
});

app.get('/signin', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `/`,
    },
  });

  if (error) {
    console.error('Sign-in error:', error);
    return c.json({ error: 'Sign-in failed' }, 500);
  }

  console.log('Redirecting to kakao for sign-in...');
  return c.redirect(data.url);
});


app.get('/signout', async (c) => {
  const supabase = getSupabase(c);
  await supabase.auth.signOut();
  console.log('Signed out server-side!');
  return c.redirect('/');
});

app.get('/countries', async (c) => {
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('countries').select('*');
  if (error) console.log(error);
  return c.json(data);
});

app.route('/example', exampleSelectPgTablesRoute);

export type AppType = typeof routes;

export default app