import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../../db/schema.pg';

type GenericDb = PostgresJsDatabase<typeof schema>;

/**
 * [기존] 사용자가 특정 학원에 대해 최상위 관리자(원장 또는 부원장) 권한을 가지고 있는지 확인합니다.
 */
export async function hasAcademyAdminPermission(db: GenericDb, requesterProfileId: string, academyId: string): Promise<boolean> {
    const isPrincipal = await db.query.academiesTable.findFirst({
        where: and(
            eq(schema.academiesTable.id, academyId), 
            eq(schema.academiesTable.principal_id, requesterProfileId)
        )
    });
    if (isPrincipal) {
        return true;
    }

    const userRoles = await db.query.userRolesTable.findMany({
        where: eq(schema.userRolesTable.user_id, requesterProfileId),
        with: {
            role: { columns: { name: true } }
        }
    });
    const hasVpRole = userRoles.some(ur => ur.role.name === '부원장');
    
    if (!hasVpRole) {
        return false;
    }

    const membership = await db.query.academyMembersTable.findFirst({
        where: and(
            eq(schema.academyMembersTable.academy_id, academyId),
            eq(schema.academyMembersTable.profile_id, requesterProfileId)
        )
    });
    
    return !!membership;
}

/**
 * [다대다 관계 지원으로 수정] 사용자가 특정 학생 멤버를 조회/수정/관리할 수 있는 권한이 있는지 확인합니다.
 * 1. 학원 최고 관리자(원장, 부원장)는 항상 권한을 가집니다.
 * 2. 요청자가 해당 학생의 담당 관리자(강사 등)로 지정된 경우 권한을 가집니다.
 * 
 * @param db - Drizzle 인스턴스
 * @param requesterProfileId - 요청을 보낸 사용자의 profile.id
 * @param targetStudentMemberId - 관리 대상이 되는 학생의 academy_members.id
 * @returns 권한이 있으면 true, 없으면 false
 */
export async function canManageStudent(db: GenericDb, requesterProfileId: string, targetStudentMemberId: string): Promise<boolean> {
    // 1. 대상 학생 정보 조회
    const targetStudent = await db.query.academyMembersTable.findFirst({
        where: and(
            eq(schema.academyMembersTable.id, targetStudentMemberId),
            eq(schema.academyMembersTable.member_type, 'student')
        ),
        columns: { academy_id: true }
    });

    if (!targetStudent) {
        // 대상 학생이 존재하지 않으면 권한 없음
        return false;
    }

    // 2. 요청자가 학원 최고 관리자인지 확인
    const isAcademyAdmin = await hasAcademyAdminPermission(db, requesterProfileId, targetStudent.academy_id);
    if (isAcademyAdmin) {
        return true; // 최고 관리자는 모든 학생 관리 가능
    }

    // 3. 요청자가 담당 관리자인지 확인
    // 먼저 요청자의 해당 학원 내 관리자(강사, 직원) 멤버 ID를 모두 찾음 (한 사람이 여러 역할 가질 수 있음)
    const requesterManagerMembers = await db.query.academyMembersTable.findMany({
        where: and(
            eq(schema.academyMembersTable.profile_id, requesterProfileId),
            eq(schema.academyMembersTable.academy_id, targetStudent.academy_id),
            inArray(schema.academyMembersTable.member_type, ['teacher', 'staff'])
        ),
        columns: { id: true } // 권한 체크에는 id만 필요
    });

    if (requesterManagerMembers.length === 0) {
        // 요청자가 해당 학원의 강사나 직원이 아니면 권한 없음
        return false;
    }
    
    const requesterManagerMemberIds = requesterManagerMembers.map(m => m.id);

    // studentManagerLinksTable에서 학생과 관리자 간의 연결이 있는지 확인
    const linkExists = await db.query.studentManagerLinksTable.findFirst({
        where: and(
            eq(schema.studentManagerLinksTable.student_member_id, targetStudentMemberId),
            inArray(schema.studentManagerLinksTable.manager_member_id, requesterManagerMemberIds)
        )
    });

    return !!linkExists; // 연결이 존재하면 true, 없으면 false
}