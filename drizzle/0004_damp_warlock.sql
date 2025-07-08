CREATE TABLE "student_manager_links" (
	"student_member_id" uuid NOT NULL,
	"manager_member_id" uuid NOT NULL,
	"context" text,
	CONSTRAINT "student_manager_links_student_member_id_manager_member_id_pk" PRIMARY KEY("student_member_id","manager_member_id")
);
--> statement-breakpoint
ALTER TABLE "academy_members" DROP CONSTRAINT "academy_members_managed_by_member_id_academy_members_id_fk";
--> statement-breakpoint
ALTER TABLE "student_manager_links" ADD CONSTRAINT "student_manager_links_student_member_id_academy_members_id_fk" FOREIGN KEY ("student_member_id") REFERENCES "public"."academy_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_manager_links" ADD CONSTRAINT "student_manager_links_manager_member_id_academy_members_id_fk" FOREIGN KEY ("manager_member_id") REFERENCES "public"."academy_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_members" DROP COLUMN "managed_by_member_id";