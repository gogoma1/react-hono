import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, inArray, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';


import type { AppEnv } from '../../../index';
import * as schemaD1 from '../../../db/schema.d1';

const subtitleRoutes = new Hono<AppEnv>();

// [신규] 소제목을 다른 폴더로 이동시키기 위한 스키마
const moveSubtitleSchema = z.object({
    targetFolderId: z.string().nullable(), // null을 보내면 폴더에서 빼내는 동작
});

/**
 * [신규] PUT /subtitles/:subtitleId/move
 * 특정 소제목을 다른 폴더로 이동시키거나 폴더에서 제외합니다.
 * 프론트엔드의 드래그 앤 드롭 기능이 이 API를 호출합니다.
 */
subtitleRoutes.put(
    '/subtitles/:subtitleId/move',
    zValidator('json', moveSubtitleSchema),
    async (c) => {
        const user = c.get('user');
        const { subtitleId } = c.req.param();
        const { targetFolderId } = c.req.valid('json');

        const db = drizzle(c.env.D1_DATABASE, { schema: schemaD1 });

        try {
            // 권한 확인: 해당 소제목에 포함된 문제의 생성자가 현재 사용자인지 확인
            const subtitle = await db.query.subtitlesTable.findFirst({
                where: eq(schemaD1.subtitlesTable.id, subtitleId),
                with: {
                    problems: {
                        columns: { creator_id: true },
                        limit: 1, // 1개의 문제만 확인해도 충분
                    }
                }
            });

            if (!subtitle || subtitle.problems[0]?.creator_id !== user.id) {
                return c.json({ error: '소제목을 찾을 수 없거나 수정할 권한이 없습니다.' }, 404);
            }
            
            // 이동할 대상 폴더가 유효한지, 사용자가 소유한 폴더인지 확인
            if (targetFolderId) {
                const folder = await db.query.foldersTable.findFirst({
                    where: and(
                        eq(schemaD1.foldersTable.id, targetFolderId),
                        eq(schemaD1.foldersTable.creator_id, user.id)
                    )
                });
                if (!folder) {
                    return c.json({ error: '대상 폴더를 찾을 수 없거나 접근 권한이 없습니다.' }, 404);
                }
            }

            // subtitles 테이블의 folder_id 업데이트
            const [updatedSubtitle] = await db.update(schemaD1.subtitlesTable)
                .set({ folder_id: targetFolderId })
                .where(eq(schemaD1.subtitlesTable.id, subtitleId))
                .returning();
            
            if (!updatedSubtitle) {
                return c.json({ error: '소제목 정보 업데이트에 실패했습니다.' }, 500);
            }

            return c.json(updatedSubtitle);

        } catch (error: any) {
            console.error(`Failed to move subtitle ${subtitleId}:`, error);
            return c.json({ error: '소제목 이동 중 데이터베이스 오류가 발생했습니다.', details: error.message }, 500);
        }
    }
);


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
        const problemSet = await db.query.problemSetTable.findFirst({
            where: and(
                eq(schemaD1.problemSetTable.problem_set_id, problemSetId),
                eq(schemaD1.problemSetTable.creator_id, user.id)
            )
        });

        if (!problemSet) {
            return c.json({ error: '문제집을 찾을 수 없거나 접근 권한이 없습니다.' }, 404);
        }

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


        if (problemIdsToDelete.length > 0) {
            statements.push(
                db.delete(schemaD1.problemTable).where(inArray(schemaD1.problemTable.problem_id, problemIdsToDelete))
            );
        }

        statements.push(
            db.delete(schemaD1.subtitlesTable).where(eq(schemaD1.subtitlesTable.id, subtitleId))
        );
        
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

        if (statements.length > 0) {
            await db.batch(statements as [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]]);
        } else {
             await db.delete(schemaD1.subtitlesTable).where(eq(schemaD1.subtitlesTable.id, subtitleId));
        }

        return c.json({ message: '소제목과 관련 데이터가 영구적으로 삭제되었습니다.' }, 200);

    } catch (error: any) {
        console.error('Failed to delete subtitle and related data from D1:', error);
        return c.json({ error: '데이터베이스 작업 중 오류가 발생했습니다.', details: error.cause ? error.cause.message : error.message }, 500);
    }
});

export default subtitleRoutes;