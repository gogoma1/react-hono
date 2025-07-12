CREATE TYPE "public"."entitlement_grant_reason_enum" AS ENUM('purchase', 'subscription', 'free_claim', 'creator');--> statement-breakpoint
CREATE TYPE "public"."seller_status_enum" AS ENUM('none', 'pending_approval', 'approved', 'rejected');--> statement-breakpoint
ALTER TABLE "problem_set_entitlements" RENAME COLUMN "access_granted_by" TO "source_id";--> statement-breakpoint
ALTER TABLE "problem_set_entitlements" DROP CONSTRAINT "problem_set_entitlements_access_granted_by_subscriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "problem_set_entitlements" ADD COLUMN "grant_reason" "entitlement_grant_reason_enum" NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "seller_status" "seller_status_enum" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "business_info" jsonb;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_user_problem_set_entitlement_idx" ON "problem_set_entitlements" USING btree ("user_id","problem_set_id");