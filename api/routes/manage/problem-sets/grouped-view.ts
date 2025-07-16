// ./api/routes/manage/problem-sets/grouped-view.ts
import { Hono } from 'hono';
import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc, asc } from 'drizzle-orm';
import postgres from 'postgres';

import type { AppEnv } from '../../../index';
import * as schemaD1 from '../../../db/schema.d1';
import * as schemaPg from '../../../db/schema.pg';
import { GRADES } from '../../../shared/curriculum.data';

const groupedViewRoutes = new Hono<AppEnv>();

// [수정] grouped-view API 로직 전면 재수정
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
        
        if (entitlements.length === 0) {
            return c.json([]); // 문제집이 없으면 빈 배열 반환
        }
        const problemSetIds = entitlements.map(e => e.problem_set_id);

        const problemSetsWithDetails = await dbD1.query.problemSetTable.findMany({
            where: and(
                inArray(schemaD1.problemSetTable.problem_set_id, problemSetIds),
                eq(schemaD1.problemSetTable.status, 'private')
            ),
            orderBy: [desc(schemaD1.problemSetTable.created_at)],
            with: {
                folders: { // 문제집에 속한 폴더(소제목 그룹)들을 가져옴
                    orderBy: asc(schemaD1.foldersTable.name)
                },
                problemSetProblems: {
                    with: {
                        problem: {
                            with: {
                                subtitle: true 
                            }
                        }
                    }
                }
            }
        });

        const processedProblemSets = problemSetsWithDetails.map(ps => {
            const gradesMap = new Map<string, {
                grade_id: string;
                grade_name: string;
                grade_order: number;
                folders: any[]; // 학년 아래 폴더들
                subtitles: any[]; // 폴더에 속하지 않은 소제목들
            }>();

            // 1. 문제집의 모든 폴더를 학년별로 미리 그룹화
            for (const folder of ps.folders) {
                const gradeId = folder.grade_id || 'unassigned';
                const gradeInfo = GRADES[gradeId as keyof typeof GRADES] || { name: '미지정', order: 999 };

                if (!gradesMap.has(gradeId)) {
                    gradesMap.set(gradeId, {
                        grade_id: gradeId,
                        grade_name: gradeInfo.name,
                        grade_order: gradeInfo.order,
                        folders: [],
                        subtitles: [],
                    });
                }
                gradesMap.get(gradeId)!.folders.push({
                    id: folder.id,
                    name: folder.name,
                    type: 'folder', // 프론트엔드에서 구분을 위함
                    subtitles: [] // 이 폴더에 속할 소제목을 담을 배열
                });
            }

            // 2. 모든 문제를 순회하며 학년별/소제목별/폴더별로 그룹화
            for (const psp of ps.problemSetProblems) {
                const problem = psp.problem;
                if (!problem || !problem.subtitle) continue;

                const gradeId = problem.grade_id || 'unassigned';
                const gradeInfo = GRADES[gradeId as keyof typeof GRADES] || { name: '미지정', order: 999 };
                if (!gradesMap.has(gradeId)) {
                    gradesMap.set(gradeId, {
                        grade_id: gradeId,
                        grade_name: gradeInfo.name,
                        grade_order: gradeInfo.order,
                        folders: [],
                        subtitles: [],
                    });
                }
                const currentGrade = gradesMap.get(gradeId)!;
                const folderId = problem.subtitle.folder_id;

                if (folderId) {
                    // 소제목이 폴더에 속한 경우
                    const targetFolder = currentGrade.folders.find(f => f.id === folderId);
                    if (targetFolder) {
                        let subtitleInFolder = targetFolder.subtitles.find((s:any) => s.subtitle_id === problem.subtitle!.id);
                        if (!subtitleInFolder) {
                            subtitleInFolder = { subtitle_id: problem.subtitle.id, subtitle_name: problem.subtitle.name, problem_count: 0, type: 'subtitle' };
                            targetFolder.subtitles.push(subtitleInFolder);
                        }
                        subtitleInFolder.problem_count++;
                    }
                } else {
                    // 소제목이 폴더에 속하지 않은 경우
                    let subtitleInGrade = currentGrade.subtitles.find(s => s.subtitle_id === problem.subtitle!.id);
                    if(!subtitleInGrade) {
                        subtitleInGrade = { subtitle_id: problem.subtitle.id, subtitle_name: problem.subtitle.name, problem_count: 0, type: 'subtitle' };
                        currentGrade.subtitles.push(subtitleInGrade);
                    }
                    subtitleInGrade.problem_count++;
                }
            }
            
            const sortedGrades = Array.from(gradesMap.values())
                .sort((a, b) => a.grade_order - b.grade_order)
                .map(grade => ({
                    ...grade,
                    // 폴더 내 소제목 정렬
                    folders: grade.folders.map(f => ({ ...f, subtitles: f.subtitles.sort((a:any, b:any) => a.subtitle_name.localeCompare(b.subtitle_name)) })),
                    // 폴더 미지정 소제목 정렬
                    subtitles: grade.subtitles.sort((a,b) => a.subtitle_name.localeCompare(b.subtitle_name)),
                }));
            
            return {
                problem_set_id: ps.problem_set_id,
                problem_set_name: ps.name,
                grades: sortedGrades,
            };
        });

        // 이제 API 응답은 문제집 배열만 포함합니다. 폴더는 문제집의 하위 데이터입니다.
        return c.json(processedProblemSets);

    } catch (error: any) {
        console.error('Failed to fetch my library data:', error);
        return c.json({ error: '라이브러리 정보를 가져오는 중 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(pg.end());
    }
});


export default groupedViewRoutes;