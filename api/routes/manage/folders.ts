// ./api/routes/manage/folders.ts

import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.d1';

// [최종 수정] 폴더(소제목 그룹) 생성에 필요한 정보를 받도록 스키마 정의
const folderSchema = z.object({
  name: z.string().min(1, '폴더 이름은 필수입니다.'),
  problem_set_id: z.string().min(1, '문제집 ID는 필수입니다.'),
  grade_id: z.string().min(1, '학년 ID는 필수입니다.'),
});

// [최종 수정] 이름 변경
const subtitleGroupRoutes = new Hono<AppEnv>();

subtitleGroupRoutes.post('/', zValidator('json', folderSchema), async (c) => {
    const user = c.get('user');
    const { name, problem_set_id, grade_id } = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });
    
    try {
        // TODO: 사용자가 해당 문제집에 대한 권한이 있는지 확인하는 로직 추가하면 더 안전함
        
        const newId = `fld_${crypto.randomUUID()}`;
        const [newFolder] = await db.insert(schema.foldersTable).values({
            id: newId,
            name,
            creator_id: user.id,
            problem_set_id,
            grade_id,
        }).returning();

        return c.json(newFolder, 201);
    } catch (e: any) {
        console.error("Failed to create folder: ", e);
        return c.json({ error: "폴더(소제목 그룹) 생성에 실패했습니다." }, 500);
    }
});

subtitleGroupRoutes.put('/:id', zValidator('json', z.object({ name: z.string().min(1) })), async (c) => {
    const user = c.get('user');
    const folderId = c.req.param('id');
    const { name } = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });

    try {
        const [updatedFolder] = await db.update(schema.foldersTable)
            .set({ name })
            .where(and(
                eq(schema.foldersTable.id, folderId),
                eq(schema.foldersTable.creator_id, user.id)
            ))
            .returning();
        
        if (!updatedFolder) {
            return c.json({ error: "폴더를 찾을 수 없거나 수정할 권한이 없습니다." }, 404);
        }
        return c.json(updatedFolder);
    } catch (e) {
        console.error(`Failed to update folder ${folderId}: `, e);
        return c.json({ error: "폴더 수정에 실패했습니다." }, 500);
    }
});

subtitleGroupRoutes.delete('/:id', async (c) => {
    const user = c.get('user');
    const folderId = c.req.param('id');
    const db = drizzle(c.env.D1_DATABASE, { schema });

    try {
        const [deleted] = await db.delete(schema.foldersTable)
            .where(and(
                eq(schema.foldersTable.id, folderId),
                eq(schema.foldersTable.creator_id, user.id)
            ))
            .returning({ id: schema.foldersTable.id });
        
        if (!deleted) {
             return c.json({ error: "폴더를 찾을 수 없거나 삭제할 권한이 없습니다." }, 404);
        }
        
        return c.json({ message: "폴더가 삭제되었습니다." }, 200);

    } catch (e) {
        console.error(`Failed to delete folder ${folderId}: `, e);
        return c.json({ error: "폴더 삭제에 실패했습니다." }, 500);
    }
});

export default subtitleGroupRoutes;