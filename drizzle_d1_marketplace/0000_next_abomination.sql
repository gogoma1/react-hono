CREATE TABLE `marketplace_listings` (
	`problem_set_id` text PRIMARY KEY NOT NULL,
	`seller_id` text NOT NULL,
	`price` integer DEFAULT 0 NOT NULL,
	`title` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`introduction` text,
	`average_rating` real DEFAULT 0 NOT NULL,
	`ratings_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	`updated_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);
--> statement-breakpoint
CREATE INDEX `listings_seller_id_idx` ON `marketplace_listings` (`seller_id`);--> statement-breakpoint
CREATE INDEX `listings_status_idx` ON `marketplace_listings` (`status`);--> statement-breakpoint
CREATE TABLE `problem_set_reviews` (
	`problem_set_id` text NOT NULL,
	`user_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	`updated_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	PRIMARY KEY(`user_id`, `problem_set_id`)
);
--> statement-breakpoint
CREATE INDEX `reviews_problem_set_id_idx` ON `problem_set_reviews` (`problem_set_id`);--> statement-breakpoint
CREATE TABLE `purchase_logs` (
	`log_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`problem_set_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'KRW' NOT NULL,
	`payment_gateway` text,
	`transaction_id` text,
	`purchased_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `purchases_user_id_idx` ON `purchase_logs` (`user_id`);--> statement-breakpoint
CREATE INDEX `purchases_problem_set_id_idx` ON `purchase_logs` (`problem_set_id`);