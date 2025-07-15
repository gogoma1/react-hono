import { Hono } from 'hono';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, sql, asc } from 'drizzle-orm';
import postgres from 'postgres';

import type { AppEnv } from '../../../index';
import * as schemaD1 from '../../../db/schema.d1';
import * as schemaPg from '../../../db/schema.pg';

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
            gradeId: schemaD1.gradesTable.id,
            gradeName: schemaD1.gradesTable.name,
            gradeOrder: schemaD1.gradesTable.order,
            sourceId: schemaD1.sourcesTable.id,
            sourceName: schemaD1.sourcesTable.name,
            problemCount: sql<number>`count(${schemaD1.problemTable.problem_id})`.as('problemCount'),
        })
        .from(schemaD1.problemSetTable)
        .leftJoin(schemaD1.problemSetProblemsTable, eq(schemaD1.problemSetTable.problem_set_id, schemaD1.problemSetProblemsTable.problem_set_id))
        .leftJoin(schemaD1.problemTable, eq(schemaD1.problemSetProblemsTable.problem_id, schemaD1.problemTable.problem_id))
        .leftJoin(schemaD1.gradesTable, eq(schemaD1.problemTable.grade_id, schemaD1.gradesTable.id))
        .leftJoin(schemaD1.sourcesTable, eq(schemaD1.problemTable.source_id, schemaD1.sourcesTable.id))
        .where(inArray(schemaD1.problemSetTable.problem_set_id, problemSetIds))
        .groupBy(
            schemaD1.problemSetTable.problem_set_id,
            schemaD1.problemSetTable.name,
            schemaD1.gradesTable.id,
            schemaD1.gradesTable.name,
            schemaD1.gradesTable.order,
            schemaD1.sourcesTable.id,
            schemaD1.sourcesTable.name
        )
        .orderBy(
            asc(schemaD1.problemSetTable.name), 
            asc(schemaD1.gradesTable.order),
            asc(schemaD1.sourcesTable.name)
        );

        const problemSetMap = new Map();

        for (const row of detailedData) {
            if (!row.problemSetId || !row.gradeId || !row.sourceId) continue;

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
                    grade_name: row.gradeName,
                    grade_order: row.gradeOrder,
                    sources: [],
                });
            }
            const currentGrade = currentProblemSet.grades.get(row.gradeId);
            
            currentGrade.sources.push({
                source_id: row.sourceId,
                source_name: row.sourceName,
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