import { Hono } from 'hono';
import type { AppEnv } from '../../../index';

import groupedViewRoutes from './grouped-view';
import crudRoutes from './crud';
// 필요하다면 legacy 라우트도 여기에 추가합니다.

const problemSetRoutes = new Hono<AppEnv>();

problemSetRoutes.route('/', groupedViewRoutes);
problemSetRoutes.route('/', crudRoutes);

export default problemSetRoutes;