import { Hono } from 'hono';
import type { AppEnv } from '../../index';
import assignmentRoutes from './assignments';
import submissionRoutes from './submissions';

const examRoutes = new Hono<AppEnv>();

// '/api/exams' 경로 아래에 각 라우트를 등록합니다.
// 예를 들어 assignmentRoutes의 '/assign'은 '/api/exams/assign'이 됩니다.
examRoutes.route('/', assignmentRoutes);
examRoutes.route('/', submissionRoutes);

export default examRoutes;