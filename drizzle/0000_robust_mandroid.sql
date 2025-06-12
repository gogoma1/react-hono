CREATE TYPE "public"."student_status_enum" AS ENUM('재원', '휴원', '퇴원');--> statement-breakpoint
CREATE TABLE "core_concepts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "core_concepts_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "major_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "major_chapters_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "middle_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"major_chapter_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_set" (
	"problem_set_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"grade" text,
	"semester" text,
	"avg_difficulty" text,
	"cover_image" text,
	"description" text,
	"published_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_set_id" uuid,
	"problem_id" uuid NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"wrong_rate" real,
	"avg_time" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem" (
	"problem_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_set_id" uuid,
	"source" text,
	"page" integer,
	"question_number" real,
	"answer" text,
	"problem_type" text,
	"creator_id" uuid NOT NULL,
	"major_chapter_id" uuid,
	"middle_chapter_id" uuid,
	"core_concept_id" uuid,
	"problem_category" text,
	"difficulty" text,
	"score" text,
	"question_text" text,
	"option_text" text,
	"solution_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"problem_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"tuition" integer,
	"admission_date" date,
	"discharge_date" date,
	"principal_id" uuid,
	"grade" text NOT NULL,
	"student_phone" text,
	"guardian_phone" text,
	"school_name" text,
	"class_name" text,
	"student_name" text NOT NULL,
	"teacher" text,
	"status" "student_status_enum" NOT NULL,
	"subject" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"tag_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"tag_type" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_problem_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_id" uuid,
	"is_correct" boolean,
	"a_solved" boolean DEFAULT false NOT NULL,
	"q_unknown" boolean DEFAULT false NOT NULL,
	"t_think" boolean DEFAULT false NOT NULL,
	"qt_failed" boolean DEFAULT false NOT NULL,
	"time_taken" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_purchase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_set_id" uuid,
	"purchase_date" timestamp with time zone,
	"purchase_price" integer,
	"license_period" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "middle_chapters" ADD CONSTRAINT "middle_chapters_major_chapter_id_major_chapters_id_fk" FOREIGN KEY ("major_chapter_id") REFERENCES "public"."major_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_stats" ADD CONSTRAINT "problem_stats_problem_set_id_problem_set_problem_set_id_fk" FOREIGN KEY ("problem_set_id") REFERENCES "public"."problem_set"("problem_set_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_stats" ADD CONSTRAINT "problem_stats_problem_id_problem_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("problem_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_problem_set_id_problem_set_problem_set_id_fk" FOREIGN KEY ("problem_set_id") REFERENCES "public"."problem_set"("problem_set_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_creator_id_profiles_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_major_chapter_id_major_chapters_id_fk" FOREIGN KEY ("major_chapter_id") REFERENCES "public"."major_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_middle_chapter_id_middle_chapters_id_fk" FOREIGN KEY ("middle_chapter_id") REFERENCES "public"."middle_chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem" ADD CONSTRAINT "problem_core_concept_id_core_concepts_id_fk" FOREIGN KEY ("core_concept_id") REFERENCES "public"."core_concepts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_tag" ADD CONSTRAINT "problem_tag_problem_id_problem_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("problem_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_tag" ADD CONSTRAINT "problem_tag_tag_id_tag_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tag"("tag_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_principal_id_profiles_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problem_log" ADD CONSTRAINT "user_problem_log_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_problem_log" ADD CONSTRAINT "user_problem_log_problem_id_problem_problem_id_fk" FOREIGN KEY ("problem_id") REFERENCES "public"."problem"("problem_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_purchase" ADD CONSTRAINT "user_purchase_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_purchase" ADD CONSTRAINT "user_purchase_problem_set_id_problem_set_problem_set_id_fk" FOREIGN KEY ("problem_set_id") REFERENCES "public"."problem_set"("problem_set_id") ON DELETE set null ON UPDATE no action;