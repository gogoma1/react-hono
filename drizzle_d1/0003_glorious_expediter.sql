ALTER TABLE `problem_set` ADD `creator_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `problem_set` ADD `type` text DEFAULT 'PRIVATE_USER' NOT NULL;--> statement-breakpoint
ALTER TABLE `problem_set` ADD `status` text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE `problem_set` ADD `copyright_type` text DEFAULT 'ORIGINAL_CREATION' NOT NULL;--> statement-breakpoint
ALTER TABLE `problem_set` ADD `copyright_source` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_problem_set_problems` (
	`problem_set_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`problem_set_id`, `problem_id`),
	FOREIGN KEY (`problem_set_id`) REFERENCES `problem_set`(`problem_set_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`problem_id`) REFERENCES `problem`(`problem_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_problem_set_problems`("problem_set_id", "problem_id", "order") SELECT "problem_set_id", "problem_id", "order" FROM `problem_set_problems`;--> statement-breakpoint
DROP TABLE `problem_set_problems`;--> statement-breakpoint
ALTER TABLE `__new_problem_set_problems` RENAME TO `problem_set_problems`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_problem_tag` (
	`problem_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`problem_id`, `tag_id`),
	FOREIGN KEY (`problem_id`) REFERENCES `problem`(`problem_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`tag_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_problem_tag`("problem_id", "tag_id") SELECT "problem_id", "tag_id" FROM `problem_tag`;--> statement-breakpoint
DROP TABLE `problem_tag`;--> statement-breakpoint
ALTER TABLE `__new_problem_tag` RENAME TO `problem_tag`;