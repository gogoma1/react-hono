import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';

import type { AppEnv } from '../../../index';
import * as schemaD1 from '../../../db/schema.d1';

const subtitleRoutes = new Hono<AppEnv>();

/**
 * DELETE /:problemSetId/subtitles/:subtitleId
 * 특정 문제집에서 한 소제목을 삭제할 때, 해당 소제목과 연결된 모든 문제 원본, 
 * 그리고 소제목 원본 데이터까지 모두 영구적으로 삭제합니다.
 */
subtitleRoutes.delete('/:problemSetId/subtitles/:subtitleId', async (c) => {
    const user = c.get('user');
    const { problemSetId, subtitleId } = c.req.param();
    const db = drizzle(c.env.D1_DATABASE, { schema: schemaD1 });

    try {
        // 1. 권한 확인: 요청자가 문제집의 소유자인지 확인
        const problemSet = await db.query.problemSetTable.findFirst({
            where: and(
                eq(schemaD1.problemSetTable.problem_set_id, problemSetId),
                eq(schemaD1.problemSetTable.creator_id, user.id)
            )
        });

        if (!problemSet) {
            return c.json({ error: '문제집을 찾을 수 없거나 접근 권한이 없습니다.' }, 404);
        }

        // 2. 삭제할 문제들의 ID 목록 조회 (소제목 ID와 생성자 ID로 한정)
        const problemsToDelete = await db.select({
                problem_id: schemaD1.problemTable.problem_id
            })
            .from(schemaD1.problemTable)
            .where(and(
                eq(schemaD1.problemTable.subtitle_id, subtitleId),
                eq(schemaD1.problemTable.creator_id, user.id)
            ));
        
        const problemIdsToDelete = problemsToDelete.map(p => p.problem_id);
        const deleteCount = problemIdsToDelete.length;

        const statements: BatchItem<'sqlite'>[] = [];

        // --- 삭제 순서가 중요합니다 ---

        // Step 1: 문제 원본 데이터 삭제 (가장 먼저)
        // problemTable 레코드가 삭제되면, 이를 참조하는 다른 테이블(problemSetProblems, etc.)의
        // 레코드들이 'cascade' 옵션에 의해 연쇄적으로 삭제됩니다.
        if (problemIdsToDelete.length > 0) {
            statements.push(
                db.delete(schemaD1.problemTable).where(inArray(schemaD1.problemTable.problem_id, problemIdsToDelete))
            );
        }

        // Step 2: 소제목 원본 데이터 삭제
        // subtitlesTable 레코드가 삭제되면, problemSetSubtitlesTable의 레코드가 'cascade' 옵션에 의해 연쇄 삭제됩니다.
        statements.push(
            db.delete(schemaD1.subtitlesTable).where(eq(schemaD1.subtitlesTable.id, subtitleId))
        );
        
        // Step 3: 문제집의 총 문제 수 업데이트
        if (deleteCount > 0) {
            statements.push(
                db.update(schemaD1.problemSetTable)
                  .set({
                      problem_count: sql`${schemaD1.problemSetTable.problem_count} - ${deleteCount}`,
                      updated_at: new Date().toISOString().replace('T', ' ').split('.')[0]
                  })
                  .where(eq(schemaD1.problemSetTable.problem_set_id, problemSetId))
            );
        }

        // 3. 트랜잭션 실행
        if (statements.length > 0) {
            await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        } else {
             // 삭제할 문제가 없더라도 소제목-문제집 연결은 끊어야 합니다.
             // 이 경우는 subtitlesTable 레코드를 삭제하는 것만으로 충분합니다 (CASCADE).
             await db.delete(schemaD1.subtitlesTable).where(eq(schemaD1.subtitlesTable.id, subtitleId));
        }

        return c.json({ message: '소제목과 관련 데이터가 영구적으로 삭제되었습니다.' }, 200);

    } catch (error: any) {
        console.error('Failed to delete subtitle and related data from D1:', error);
        return c.json({ error: '데이터베이스 작업 중 오류가 발생했습니다.', details: error.cause ? error.cause.message : error.message }, 500);
    }
});

export default subtitleRoutes;