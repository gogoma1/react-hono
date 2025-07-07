CREATE TYPE "public"."billing_interval_enum" AS ENUM('month', 'year');--> statement-breakpoint
CREATE TYPE "public"."profile_status_enum" AS ENUM('active', 'inactive', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."subscription_status_enum" AS ENUM('active', 'canceled', 'past_due', 'incomplete');--> statement-breakpoint
CREATE TABLE "problem_set_entitlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_set_id" text NOT NULL,
	"access_granted_by" uuid,
	"access_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer,
	"billing_interval" "billing_interval_enum",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"status" "subscription_status_enum" NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"canceled_at" timestamp with time zone,
	"payment_gateway" text NOT NULL,
	"payment_gateway_subscription_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_payment_gateway_subscription_id_unique" UNIQUE("payment_gateway_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "user_purchase" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "user_purchase" CASCADE;--> statement-breakpoint
ALTER TABLE "academies" DROP CONSTRAINT "academies_principal_id_profiles_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "status" "profile_status_enum" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "problem_set_entitlements" ADD CONSTRAINT "problem_set_entitlements_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_set_entitlements" ADD CONSTRAINT "problem_set_entitlements_access_granted_by_subscriptions_id_fk" FOREIGN KEY ("access_granted_by") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academies" ADD CONSTRAINT "academies_principal_id_profiles_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;