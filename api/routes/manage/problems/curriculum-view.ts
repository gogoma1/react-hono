import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, asc, isNull } from 'drizzle-orm';

import type { AppEnv } from '../../../index';
import * as schema from '../../../db/schema.d1';
// [수정] 공유 상수 파일에서 필요한 모든 상수를 import 합니다.
import { GRADES, MAJOR_CHAPTERS, MIDDLE_CHAPTERS } from '../../../shared/curriculum.data';

const curriculumViewRoutes = new Hono<AppEnv>();

curriculumViewRoutes.get('/my-curriculum-view', async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.D1_DATABASE, { schema });

    try {
        // [수정] grades, major_chapters, middle_chapters 테이블과의 JOIN을 모두 제거합니다.
        const groupedData = await db.select({
            gradeId: schema.problemTable.grade_id,
            majorChapterId: schema.problemTable.major_chapter_id,
            middleChapterId: schema.problemTable.middle_chapter_id,
            problemCount: sql<number>`count(${schema.problemTable.problem_id})`.as('problemCount')
        })
        .from(schema.problemTable)
        .where(eq(schema.problemTable.creator_id, user.id))
        .groupBy(
            schema.problemTable.grade_id,
            schema.problemTable.major_chapter_id,
            schema.problemTable.middle_chapter_id
        )
        // 정렬은 코드 레벨에서 수행하므로 DB 정렬은 최소화합니다.
        .orderBy(
            asc(schema.problemTable.grade_id),
            asc(schema.problemTable.major_chapter_id),
            asc(schema.problemTable.middle_chapter_id)
        );

        const curriculumMap = new Map();

        for (const row of groupedData) {
            // [수정] 하드코딩된 상수 객체에서 이름과 순서 정보를 가져옵니다.
            const gradeId = row.gradeId || 'undefined';
            const gradeInfo = GRADES[gradeId as keyof typeof GRADES] ?? { name: '미지정 학년', order: 999 };

            const majorChapterId = row.majorChapterId || 'undefined';
            const majorChapterName = MAJOR_CHAPTERS[majorChapterId as keyof typeof MAJOR_CHAPTERS] || '미지정 대단원';

            const middleChapterId = row.middleChapterId || 'undefined';
            const middleChapterInfo = MIDDLE_CHAPTERS[middleChapterId as keyof typeof MIDDLE_CHAPTERS];
            const middleChapterName = middleChapterInfo ? middleChapterInfo.name : '미지정 중단원';

            // 유효한 중단원 정보가 있을 때만 처리
            if (!middleChapterInfo) continue;
            
            // 1. 학년 레벨 처리
            if (!curriculumMap.has(gradeId)) {
                curriculumMap.set(gradeId, {
                    grade_id: gradeId,
                    grade_name: gradeInfo.name,
                    grade_order: gradeInfo.order,
                    majorChapters: new Map()
                });
            }
            const currentGrade = curriculumMap.get(gradeId);

            // 2. 대단원 레벨 처리
            if (!currentGrade.majorChapters.has(majorChapterId)) {
                currentGrade.majorChapters.set(majorChapterId, {
                    major_chapter_id: majorChapterId,
                    major_chapter_name: majorChapterName,
                    middleChapters: []
                });
            }
            const currentMajorChapter = currentGrade.majorChapters.get(majorChapterId);

            // 3. 중단원 레벨 처리
            currentMajorChapter.middleChapters.push({
                middle_chapter_id: middleChapterId,
                middle_chapter_name: middleChapterName,
                problem_count: row.problemCount
            });
        }
        
        // 최종 응답 데이터를 생성하고 정렬합니다.
        const responseData = Array.from(curriculumMap.values()).map(grade => ({
            ...grade,
            // 대단원도 이름순으로 정렬 (필요시)
            majorChapters: Array.from(grade.majorChapters.values()).sort(
                (a, b) => (a as { major_chapter_name: string }).major_chapter_name.localeCompare(
                    (b as { major_chapter_name: string }).major_chapter_name
                )
            )
        })).sort((a,b) => a.grade_order - b.grade_order); // 학년 순서로 최종 정렬

        return c.json(responseData);

    } catch (error: any) {
        console.error('Failed to fetch curriculum view:', error);
        return c.json({ error: '교육과정별 문제 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    }
});

export default curriculumViewRoutes;