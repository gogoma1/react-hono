CREATE TYPE "public"."academy_status_enum" AS ENUM('운영중', '휴업', '폐업');--> statement-breakpoint
ALTER TABLE "academies" ADD COLUMN "status" "academy_status_enum" DEFAULT '운영중' NOT NULL;