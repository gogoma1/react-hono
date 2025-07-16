import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.d1';

const folderSchema = z.object({
  name: z.string().min(1, '폴더 이름은 필수입니다.'),
});

const folderRoutes = new Hono<AppEnv>();

// --- 내 모든 폴더 조회 ---
folderRoutes.get('/', async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.D1_DATABASE, { schema });

    try {
        const folders = await db.query.foldersTable.findMany({
            where: eq(schema.foldersTable.creator_id, user.id),
            orderBy: (folders, { asc }) => [asc(folders.name)],
        });
        return c.json(folders);
    } catch (e) {
        console.error("Failed to fetch folders: ", e);
        return c.json({ error: "폴더 목록을 가져오는데 실패했습니다." }, 500);
    }
});

// --- 새 폴더 생성 ---
folderRoutes.post('/', zValidator('json', folderSchema), async (c) => {
    const user = c.get('user');
    const { name } = c.req.valid('json');
    const db = drizzle(c.env.D1_DATABASE, { schema });
    
    try {
        const newId = `fld_${crypto.randomUUID()}`;
        const [newFolder] = await db.insert(schema.foldersTable).values({
            id: newId,
            name,
            creator_id: user.id,
        }).returning();

        return c.json(newFolder, 201);
    } catch (e: any) {
        console.error("Failed to create folder: ", e);
        if (e.message?.includes('UNIQUE constraint failed')) {
            return c.json({ error: "이미 존재하는 폴더 이름입니다." }, 409);
        }
        return c.json({ error: "폴더 생성에 실패했습니다." }, 500);
    }
});

// --- 폴더 이름 수정 ---
folderRoutes.put('/:id', zValidator('json', folderSchema), async (c) => {
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

// --- 폴더 삭제 ---
folderRoutes.delete('/:id', async (c) => {
    const user = c.get('user');
    const folderId = c.req.param('id');
    const db = drizzle(c.env.D1_DATABASE, { schema });

    try {
        // onDelete: 'set null' 이므로, 폴더만 삭제되고 하위 항목들은 folder_id가 null로 변경됨
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

export default folderRoutes;