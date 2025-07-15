import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, asc } from 'drizzle-orm';

import type { AppEnv } from '../../../index';
import * as schema from '../../../db/schema.d1';

const curriculumViewRoutes = new Hono<AppEnv>();

curriculumViewRoutes.get('/my-curriculum-view', async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.D1_DATABASE, { schema });

    try {
        const groupedData = await db.select({
            gradeId: schema.gradesTable.id,
            gradeName: schema.gradesTable.name,
            gradeOrder: schema.gradesTable.order,
            majorChapterId: schema.majorChaptersTable.id,
            majorChapterName: schema.majorChaptersTable.name,
            middleChapterId: schema.middleChaptersTable.id,
            middleChapterName: schema.middleChaptersTable.name,
            problemCount: sql<number>`count(${schema.problemTable.problem_id})`.as('problemCount')
        })
        .from(schema.problemTable)
        .leftJoin(schema.gradesTable, eq(schema.problemTable.grade_id, schema.gradesTable.id))
        .leftJoin(schema.majorChaptersTable, eq(schema.problemTable.major_chapter_id, schema.majorChaptersTable.id))
        .leftJoin(schema.middleChaptersTable, eq(schema.problemTable.middle_chapter_id, schema.middleChaptersTable.id))
        .where(eq(schema.problemTable.creator_id, user.id))
        .groupBy(
            schema.gradesTable.id,
            schema.gradesTable.name,
            schema.gradesTable.order,
            schema.majorChaptersTable.id,
            schema.majorChaptersTable.name,
            schema.middleChaptersTable.id,
            schema.middleChaptersTable.name
        )
        .orderBy(
            asc(schema.gradesTable.order),
            asc(schema.majorChaptersTable.name),
            asc(schema.middleChaptersTable.name)
        );

        const curriculumMap = new Map();

        for (const row of groupedData) {
            const gradeId = row.gradeId || 'undefined';
            const gradeName = row.gradeName || '미지정 학년';
            const gradeOrder = row.gradeOrder || 99;

            const majorChapterId = row.majorChapterId || 'undefined';
            const majorChapterName = row.majorChapterName || '미지정 대단원';

            const middleChapterId = row.middleChapterId || 'undefined';
            const middleChapterName = row.middleChapterName || '미지정 중단원';

            if (!curriculumMap.has(gradeId)) {
                curriculumMap.set(gradeId, {
                    grade_id: gradeId,
                    grade_name: gradeName,
                    grade_order: gradeOrder,
                    majorChapters: new Map()
                });
            }
            const currentGrade = curriculumMap.get(gradeId);

            if (!currentGrade.majorChapters.has(majorChapterId)) {
                currentGrade.majorChapters.set(majorChapterId, {
                    major_chapter_id: majorChapterId,
                    major_chapter_name: majorChapterName,
                    middleChapters: []
                });
            }
            const currentMajorChapter = currentGrade.majorChapters.get(majorChapterId);

            currentMajorChapter.middleChapters.push({
                middle_chapter_id: middleChapterId,
                middle_chapter_name: middleChapterName,
                problem_count: row.problemCount
            });
        }
        
        const responseData = Array.from(curriculumMap.values()).map(grade => ({
            ...grade,
            majorChapters: Array.from(grade.majorChapters.values())
        })).sort((a,b) => a.grade_order - b.grade_order);

        return c.json(responseData);

    } catch (error: any) {
        console.error('Failed to fetch curriculum view:', error);
        return c.json({ error: '교육과정별 문제 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    }
});

export default curriculumViewRoutes;