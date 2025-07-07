-- 트랜잭션 1: ENUM 타입에 새로운 값을 추가합니다.
ALTER TYPE "public"."exam_assignment_status_enum" ADD VALUE 'assigned' BEFORE 'not_started';
--> statement-breakpoint

-- [핵심] 여기서 트랜잭션을 커밋하여 ENUM 변경 사항을 영구적으로 반영합니다.
COMMIT;

--> statement-breakpoint

-- 트랜잭션 2: 이제 안전하게 새로운 ENUM 값을 사용할 수 있습니다.
BEGIN;
--> statement-breakpoint
ALTER TABLE "exam_assignments" RENAME COLUMN "student_id" TO "student_member_id";
--> statement-breakpoint
ALTER TABLE "exam_assignments" DROP CONSTRAINT "exam_assignments_student_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "exam_assignments" ALTER COLUMN "status" SET DEFAULT 'assigned';
--> statement-breakpoint
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_student_member_id_academy_members_id_fk" FOREIGN KEY ("student_member_id") REFERENCES "public"."academy_members"("id") ON DELETE cascade ON UPDATE no action;