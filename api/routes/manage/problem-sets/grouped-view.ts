import { Hono } from 'hono';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, sql, asc } from 'drizzle-orm';
import postgres from 'postgres';

import type { AppEnv } from '../../../index';
import * as schemaD1 from '../../../db/schema.d1';
import * as schemaPg from '../../../db/schema.pg';
import { GRADES } from '../../../shared/curriculum.data';

const groupedViewRoutes = new Hono<AppEnv>();

groupedViewRoutes.get('/my-grouped-view', async (c) => {
    const user = c.get('user');
    const dbD1 = drizzleD1(c.env.D1_DATABASE, { schema: schemaD1 });
    const pg = postgres(c.env.HYPERDRIVE.connectionString);
    const dbPg = drizzlePg(pg, { schema: schemaPg });

    try {
        const entitlements = await dbPg.query.problemSetEntitlementsTable.findMany({
            where: eq(schemaPg.problemSetEntitlementsTable.user_id, user.id),
            columns: { problem_set_id: true }
        });
        
        if (entitlements.length === 0) return c.json([]);
        const problemSetIds = entitlements.map(e => e.problem_set_id);

        const detailedData = await dbD1.select({
            problemSetId: schemaD1.problemSetTable.problem_set_id,
            problemSetName: schemaD1.problemSetTable.name,
            gradeId: schemaD1.problemTable.grade_id,
            subtitleId: schemaD1.subtitlesTable.id,
            subtitleName: schemaD1.subtitlesTable.name,
            problemCount: sql<number>`count(${schemaD1.problemTable.problem_id})`.as('problemCount'),
        })
        .from(schemaD1.problemSetTable)
        .leftJoin(schemaD1.problemSetProblemsTable, eq(schemaD1.problemSetTable.problem_set_id, schemaD1.problemSetProblemsTable.problem_set_id))
        .leftJoin(schemaD1.problemTable, eq(schemaD1.problemSetProblemsTable.problem_id, schemaD1.problemTable.problem_id))
        .leftJoin(schemaD1.subtitlesTable, eq(schemaD1.problemTable.subtitle_id, schemaD1.subtitlesTable.id))
        .where(inArray(schemaD1.problemSetTable.problem_set_id, problemSetIds))
        .groupBy(
            schemaD1.problemSetTable.problem_set_id,
            schemaD1.problemSetTable.name,
            schemaD1.problemTable.grade_id,
            schemaD1.subtitlesTable.id,
            schemaD1.subtitlesTable.name
        )
        .orderBy(
            asc(schemaD1.problemSetTable.name), 
            asc(schemaD1.problemTable.grade_id),
            asc(schemaD1.subtitlesTable.name)
        );
        
        const problemSetMap = new Map();

        for (const row of detailedData) {
            if (!row.problemSetId || !row.gradeId || !row.subtitleId) continue;
            
            const gradeInfo = GRADES[row.gradeId as keyof typeof GRADES];
            if (!gradeInfo) continue;

            if (!problemSetMap.has(row.problemSetId)) {
                problemSetMap.set(row.problemSetId, {
                    problem_set_id: row.problemSetId,
                    problem_set_name: row.problemSetName,
                    grades: new Map(),
                });
            }
            const currentProblemSet = problemSetMap.get(row.problemSetId);

            if (!currentProblemSet.grades.has(row.gradeId)) {
                currentProblemSet.grades.set(row.gradeId, {
                    grade_id: row.gradeId,
                    grade_name: gradeInfo.name,
                    grade_order: gradeInfo.order,
                    subtitles: [],
                });
            }
            const currentGrade = currentProblemSet.grades.get(row.gradeId);
            
            currentGrade.subtitles.push({
                subtitle_id: row.subtitleId,
                subtitle_name: row.subtitleName,
                problem_count: row.problemCount,
            });
        }
        
        const responseData = Array.from(problemSetMap.values()).map(ps => ({
            ...ps,
            grades: (Array.from(ps.grades.values()) as { grade_order: number }[]).sort(
                (a, b) => a.grade_order - b.grade_order
            ),
        }));

        return c.json(responseData);

    } catch (error: any) {
        console.error('Failed to fetch grouped problem set view:', error);
        return c.json({ error: '계층별 문제집 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});

export default groupedViewRoutes;