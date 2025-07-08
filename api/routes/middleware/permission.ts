// ./api/routes/middleware/permission.ts 전문

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, inArray } from 'drizzle-orm';
import * as schema from '../../db/schema.pg';

// Drizzle-ORM의 Neon HTTP, Postgres.js 등 다양한 드라이버와 호환되도록 타입을 정의합니다.
type GenericDb = PostgresJsDatabase<typeof schema>;

/**
 * [이름 변경 및 개선] 사용자가 특정 학원에 대해 최상위 관리자(원장 또는 부원장) 권한을 가지고 있는지 확인합니다.
 * 이 함수는 학원 전체에 영향을 미치는 작업 (예: 새로운 강사 등록, 학원 정보 수정)에 사용됩니다.
 * 
 * @param db - Drizzle 인스턴스
 * @param requesterProfileId - 권한을 확인할 사용자의 profile.id
 * @param academyId - 대상 학원의 ID
 * @returns 권한이 있으면 true, 없으면 false
 */
export async function hasAcademyAdminPermission(db: GenericDb, requesterProfileId: string, academyId: string): Promise<boolean> {
    // 1. 요청자가 해당 학원의 원장(principal)인지 확인합니다. 원장이라면 즉시 true를 반환합니다.
    const isPrincipal = await db.query.academiesTable.findFirst({
        where: and(
            eq(schema.academiesTable.id, academyId), 
            eq(schema.academiesTable.principal_id, requesterProfileId)
        )
    });
    if (isPrincipal) {
        return true;
    }

    // 2. 원장이 아니라면, '부원장' 역할을 가졌는지 확인합니다.
    const userRoles = await db.query.userRolesTable.findMany({
        where: eq(schema.userRolesTable.user_id, requesterProfileId),
        with: {
            role: { columns: { name: true } }
        }
    });
    const hasVpRole = userRoles.some(ur => ur.role.name === '부원장');
    
    // '부원장' 역할이 없으면 권한이 없습니다.
    if (!hasVpRole) {
        return false;
    }

    // 3. '부원장' 역할이 있다면, 해당 학원의 멤버로 등록되어 있는지 최종 확인합니다.
    // (다른 학원의 부원장이 이 학원의 권한을 가질 수 없도록 방지)
    const membership = await db.query.academyMembersTable.findFirst({
        where: and(
            eq(schema.academyMembersTable.academy_id, academyId),
            eq(schema.academyMembersTable.profile_id, requesterProfileId)
        )
    });
    
    // 멤버십 정보가 존재하면 최종적으로 권한이 있음을 의미합니다.
    return !!membership;
}

/**
 * [다대다 관계 지원으로 수정] 사용자가 특정 학생 멤버를 조회/수정/관리할 수 있는 권한이 있는지 확인합니다.
 * 이 함수는 특정 학생 개개인에 대한 작업 (예: 학생 정보 수정, 시험 할당)에 사용됩니다.
 * 
 * @param db - Drizzle 인스턴스
 * @param requesterProfileId - 요청을 보낸 사용자의 profile.id
 * @param targetStudentMemberId - 관리 대상이 되는 학생의 academy_members.id
 * @returns 권한이 있으면 true, 없으면 false
 */
export async function canManageStudent(db: GenericDb, requesterProfileId: string, targetStudentMemberId: string): Promise<boolean> {
    // 1. 먼저, 관리 대상인 학생의 정보를 DB에서 조회합니다.
    const targetStudent = await db.query.academyMembersTable.findFirst({
        where: and(
            eq(schema.academyMembersTable.id, targetStudentMemberId),
            eq(schema.academyMembersTable.member_type, 'student')
        ),
        columns: { academy_id: true }
    });

    // 관리 대상 학생이 존재하지 않으면, 권한도 존재할 수 없습니다.
    if (!targetStudent) {
        return false;
    }

    // 2. 요청자가 해당 학원의 '전체 관리자(원장/부원장)'인지 확인합니다.
    // 전체 관리자는 모든 학생에 대한 권한을 가집니다.
    const isAcademyAdmin = await hasAcademyAdminPermission(db, requesterProfileId, targetStudent.academy_id);
    if (isAcademyAdmin) {
        return true;
    }

    // 3. 전체 관리자가 아니라면, 요청자가 '담당 강사'인지 확인합니다.
    // 먼저 요청자의 '강사' 멤버 정보를 해당 학원에서 찾습니다. (한 사용자가 같은 학원에서 여러 강사 역할을 가질 수 있는 예외 케이스 고려)
    const requesterTeacherMembers = await db.query.academyMembersTable.findMany({
        where: and(
            eq(schema.academyMembersTable.profile_id, requesterProfileId),
            eq(schema.academyMembersTable.academy_id, targetStudent.academy_id),
            // 담당자는 강사 또는 일반 직원일 수 있습니다.
            inArray(schema.academyMembersTable.member_type, ['teacher', 'staff'])
        ),
        columns: { id: true } // 권한 체크에는 id만 필요합니다.
    });

    // 요청자가 해당 학원의 강사/직원이 아니면 권한이 없습니다.
    if (requesterTeacherMembers.length === 0) {
        return false;
    }
    
    // 요청자의 모든 강사/직원 member id 목록을 만듭니다.
    const requesterManagerMemberIds = requesterTeacherMembers.map(m => m.id);

    // 4. 연결 테이블(studentManagerLinksTable)에서 [대상 학생]과 [요청자(강사/직원)]의 연결고리가 있는지 확인합니다.
    const linkExists = await db.query.studentManagerLinksTable.findFirst({
        where: and(
            eq(schema.studentManagerLinksTable.student_member_id, targetStudentMemberId),
            // 요청자의 여러 담당자 ID 중 하나라도 연결되어 있으면 권한이 있습니다.
            inArray(schema.studentManagerLinksTable.manager_member_id, requesterManagerMemberIds)
        )
    });

    // 연결고리가 존재하면 최종적으로 권한이 있음을 의미합니다.
    return !!linkExists;
}

// default export를 제거하고, 필요한 함수를 named export로 내보냅니다.
// export default hasAcademyAdminPermission; // 이 라인은 제거하거나 주석 처리