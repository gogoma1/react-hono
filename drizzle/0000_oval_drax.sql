CREATE TYPE "public"."exam_assignment_status_enum" AS ENUM('not_started', 'in_progress', 'completed', 'graded', 'expired');--> statement-breakpoint
CREATE TYPE "public"."student_status_enum" AS ENUM('재원', '휴원', '퇴원');--> statement-breakpoint
CREATE TABLE "exam_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_set_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"status" "exam_assignment_status_enum" DEFAULT 'not_started' NOT NULL,
	"correct_rate" real,
	"total_pure_time_seconds" integer,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "exam_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"problem_ids" jsonb NOT NULL,
	"header_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"position" text NOT NULL,
	"academy_name" text NOT NULL,
	"region" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"principal_id" uuid,
	"student_name" text NOT NULL,
	"grade" text NOT NULL,
	"status" "student_status_enum" NOT NULL,
	"subject" text NOT NULL,
	"tuition" integer,
	"admission_date" date,
	"discharge_date" date,
	"student_phone" text,
	"guardian_phone" text,
	"school_name" text,
	"class_name" text,
	"teacher" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_purchase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_set_id" text,
	"purchase_date" timestamp with time zone,
	"purchase_price" integer,
	"license_period" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_exam_set_id_exam_sets_id_fk" FOREIGN KEY ("exam_set_id") REFERENCES "public"."exam_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_assignments" ADD CONSTRAINT "exam_assignments_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sets" ADD CONSTRAINT "exam_sets_creator_id_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_principal_id_profiles_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_purchase" ADD CONSTRAINT "user_purchase_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;