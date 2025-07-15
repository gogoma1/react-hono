import { Hono } from 'hono';
import type { AppEnv } from '../../../index';

import curriculumViewRoutes from './curriculum-view';
import crudRoutes from './crud';

const problemRoutes = new Hono<AppEnv>();

problemRoutes.route('/', curriculumViewRoutes);
problemRoutes.route('/', crudRoutes);

export default problemRoutes;