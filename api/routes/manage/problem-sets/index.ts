import { Hono } from 'hono';
import type { AppEnv } from '../../../index';

import groupedViewRoutes from './grouped-view';
import crudRoutes from './crud';
import problemUpdateRoutes from './problemsUpdate';
import subtitleRoutes from './subtitles'; 

const problemSetRoutes = new Hono<AppEnv>();

problemSetRoutes.route('/', groupedViewRoutes);
problemSetRoutes.route('/', crudRoutes);
problemSetRoutes.route('/', problemUpdateRoutes);
problemSetRoutes.route('/', subtitleRoutes); 

export default problemSetRoutes;