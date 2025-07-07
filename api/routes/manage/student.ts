import { Hono } from 'hono';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

import type { AppEnv } from '../../index';
import * as schema from '../../db/schema.pg';

// [수정] details의 각 필드에서 .nullable() 제거. 대신 .transform으로 null을 undefined로 변환
const memberDetailsSchema = z.object({
    student_name: z.string().min(1, "학생 이름은 필수입니다."),
    grade: z.string().min(1, "학년은 필수입니다."),
    subject: z.string().min(1, "과목은 필수입니다."),
    student_phone: z.string().optional().transform(v => v || undefined),
    guardian_phone: z.string().optional().transform(v => v || undefined),
    school_name: z.string().optional().transform(v => v || undefined),
    class_name: z.string().optional().transform(v => v || undefined),
    teacher: z.string().optional().transform(v => v || undefined),
    tuition: z.number().nonnegative().optional(),
});

const createMemberSchema = z.object({
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
    member_type: z.enum(schema.memberTypeEnum.enumValues),
    details: memberDetailsSchema,
    profile_id: z.string().uuid().optional().nullable(),
});

const updateMemberSchema = z.object({
    status: z.enum(schema.memberStatusEnum.enumValues).optional(),
    details: memberDetailsSchema.partial().optional(),
    start_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
    end_date: z.string().date("YYYY-MM-DD 형식의 날짜여야 합니다.").optional().nullable(),
});

const bulkUpdateStatusSchema = z.object({
    member_ids: z.array(z.string().uuid()).min(1, "하나 이상의 ID가 필요합니다."),
    status: z.enum(schema.memberStatusEnum.enumValues),
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
});

const bulkDeleteSchema = z.object({
    member_ids: z.array(z.string().uuid()).min(1, "하나 이상의 ID가 필요합니다."),
    academy_id: z.string().uuid("유효한 학원 ID가 필요합니다."),
});


const studentRoutes = new Hono<AppEnv>();

studentRoutes.get('/:academyId', async (c) => {
    const user = c.get('user')!;
    const academyId = c.req.param('academyId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(eq(schema.academiesTable.id, academyId), eq(schema.academiesTable.principal_id, user.id))
        });
        if (!academy) return c.json({ error: '학원을 찾을 수 없거나 조회 권한이 없습니다.' }, 404);

        const members = await db.query.academyMembersTable.findMany({
            where: eq(schema.academyMembersTable.academy_id, academyId),
            orderBy: desc(schema.academyMembersTable.created_at),
        });
        return c.json(members);
    } catch (error: any) {
        console.error('Failed to fetch academy members:', error.message);
        return c.json({ error: '데이터베이스 조회에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.post('/', zValidator('json', createMemberSchema), async (c) => {
    const user = c.get('user')!;
    const { academy_id, member_type, details, profile_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(eq(schema.academiesTable.id, academy_id), eq(schema.academiesTable.principal_id, user.id))
        });
        if (!academy) return c.json({ error: '구성원을 등록할 학원을 찾을 수 없거나 권한이 없습니다.' }, 403);
        
        // [핵심 수정] Zod 스키마에서 이미 null을 undefined로 변환했으므로,
        // `details` 객체는 Drizzle 타입과 완벽하게 호환됩니다.
        const [newMember] = await db.insert(schema.academyMembersTable)
            .values({
                academy_id,
                member_type,
                details, // 이제 타입이 일치합니다.
                profile_id,
                status: 'active'
            })
            .returning();
            
        return c.json(newMember, 201);
    } catch (error: any) {
        console.error('Failed to create member:', error.message);
        if (error.code === '23505') {
            return c.json({ error: '해당 사용자는 이미 이 학원에 동일한 유형으로 등록되어 있습니다.' }, 409);
        }
        return c.json({ error: '데이터베이스 오류로 구성원 등록에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.put('/:memberId', zValidator('json', updateMemberSchema), async (c) => {
    const user = c.get('user')!;
    const memberId = c.req.param('memberId');
    const validatedData = c.req.valid('json');
    
    if (Object.keys(validatedData).length === 0) return c.json({ error: '수정할 내용이 없습니다.' }, 400);

    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const member = await db.query.academyMembersTable.findFirst({
            where: eq(schema.academyMembersTable.id, memberId),
            with: { academy: { columns: { principal_id: true } } }
        });

        if (!member || member.academy.principal_id !== user.id) {
            return c.json({ error: '수정할 구성원 정보를 찾을 수 없거나 권한이 없습니다.' }, 404);
        }
        
        const dataToUpdate: Partial<schema.DbAcademyMember> = {
            updated_at: new Date()
        };

        if(validatedData.status) dataToUpdate.status = validatedData.status;
        if(validatedData.start_date) dataToUpdate.start_date = validatedData.start_date;
        if(validatedData.end_date) dataToUpdate.end_date = validatedData.end_date;
        
        if(validatedData.details) {
            // [핵심 수정] 여기서도 null을 undefined로 변환하는 로직을 추가하거나,
            // Zod 스키마를 신뢰하고 그대로 사용합니다.
            // update 스키마도 transform을 적용하면 더 안전합니다.
            const transformedDetails = Object.fromEntries(
                Object.entries(validatedData.details).map(([key, value]) => [key, value === null ? undefined : value])
            );
            dataToUpdate.details = { ...member.details, ...transformedDetails };
        }

        const [updatedMember] = await db.update(schema.academyMembersTable)
            .set(dataToUpdate)
            .where(eq(schema.academyMembersTable.id, memberId))
            .returning();

        return c.json(updatedMember);
    } catch (error: any) {
        console.error(`Failed to update member ${memberId}:`, error);
        return c.json({ error: '데이터베이스 오류로 업데이트에 실패했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.delete('/:memberId', async (c) => {
    const user = c.get('user')!;
    const memberId = c.req.param('memberId');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const member = await db.query.academyMembersTable.findFirst({
            where: eq(schema.academyMembersTable.id, memberId),
            with: { academy: { columns: { principal_id: true } } }
        });
        if (!member || member.academy.principal_id !== user.id) {
            return c.json({ error: '상태를 변경할 구성원 정보를 찾을 수 없거나 권한이 없습니다.' }, 404);
        }
        const today = new Date().toISOString().split('T')[0];
        const [resignedMember] = await db.update(schema.academyMembersTable)
            .set({ status: 'resigned', end_date: today, updated_at: new Date() })
            .where(eq(schema.academyMembersTable.id, memberId))
            .returning({ id: schema.academyMembersTable.id });
        return c.json({ message: '상태 변경 처리가 완료되었습니다.', id: resignedMember.id });
    } catch (error: any) {
        console.error(`Failed to soft-delete member ${memberId}:`, error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.post('/bulk-update-status', zValidator('json', bulkUpdateStatusSchema), async (c) => {
    const user = c.get('user')!;
    const { member_ids, status, academy_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });

    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(eq(schema.academiesTable.id, academy_id), eq(schema.academiesTable.principal_id, user.id))
        });
        if (!academy) return c.json({ error: '요청한 학원에 대한 권한이 없습니다.' }, 403);
        const result = await db.update(schema.academyMembersTable)
            .set({ status: status, updated_at: new Date() })
            .where(and(inArray(schema.academyMembersTable.id, member_ids), eq(schema.academyMembersTable.academy_id, academy_id)))
            .returning();
        return c.json({ message: `${result.length}명의 구성원 상태가 변경되었습니다.`, updated: result });
    } catch (error: any) {
        console.error('Failed to bulk update member status:', error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

studentRoutes.post('/bulk-delete', zValidator('json', bulkDeleteSchema), async (c) => {
    const user = c.get('user')!;
    const { member_ids, academy_id } = c.req.valid('json');
    const sql = postgres(c.env.HYPERDRIVE.connectionString);
    const db = drizzle(sql, { schema });
    try {
        const academy = await db.query.academiesTable.findFirst({
            where: and(eq(schema.academiesTable.id, academy_id), eq(schema.academiesTable.principal_id, user.id))
        });
        if (!academy) return c.json({ error: '요청한 학원에 대한 권한이 없습니다.' }, 403);
        const today = new Date().toISOString().split('T')[0];
        const result = await db.update(schema.academyMembersTable)
            .set({ status: 'resigned', end_date: today, updated_at: new Date() })
            .where(and(inArray(schema.academyMembersTable.id, member_ids), eq(schema.academyMembersTable.academy_id, academy_id)))
            .returning({ id: schema.academyMembersTable.id });
        return c.json({ message: `${result.length}명의 구성원이 퇴사/퇴원 처리되었습니다.`, changedIds: result.map(s => s.id) });
    }
    catch (error: any)
    {
        console.error('Failed to bulk delete members:', error);
        return c.json({ error: '데이터베이스 오류가 발생했습니다.' }, 500);
    } finally {
        c.executionCtx.waitUntil(sql.end());
    }
});

export default studentRoutes;