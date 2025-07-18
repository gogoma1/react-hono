CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`creator_id` text NOT NULL,
	`problem_set_id` text NOT NULL,
	`grade_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	FOREIGN KEY (`problem_set_id`) REFERENCES `problem_set`(`problem_set_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `problem_calculation_skills` (
	`problem_id` text NOT NULL,
	`skill_id` text NOT NULL,
	PRIMARY KEY(`problem_id`, `skill_id`),
	FOREIGN KEY (`problem_id`) REFERENCES `problem`(`problem_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `problem_images` (
	`problem_id` text NOT NULL,
	`image_key` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	PRIMARY KEY(`problem_id`, `image_key`),
	FOREIGN KEY (`problem_id`) REFERENCES `problem`(`problem_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `problem_set_problems` (
	`problem_set_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`problem_set_id`, `problem_id`),
	FOREIGN KEY (`problem_set_id`) REFERENCES `problem_set`(`problem_set_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`problem_id`) REFERENCES `problem`(`problem_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `problem_set_subtitles` (
	`problem_set_id` text NOT NULL,
	`subtitle_id` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`problem_set_id`, `subtitle_id`),
	FOREIGN KEY (`problem_set_id`) REFERENCES `problem_set`(`problem_set_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subtitle_id`) REFERENCES `subtitles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `problem_set` (
	`problem_set_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`creator_id` text NOT NULL,
	`type` text DEFAULT 'PRIVATE_USER' NOT NULL,
	`status` text DEFAULT 'private' NOT NULL,
	`copyright_type` text DEFAULT 'ORIGINAL_CREATION' NOT NULL,
	`copyright_source` text,
	`description` text,
	`cover_image` text,
	`published_year` integer,
	`grade_id` text,
	`semester` text,
	`avg_difficulty` text,
	`problem_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	`updated_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);
--> statement-breakpoint
CREATE TABLE `problem` (
	`problem_id` text PRIMARY KEY NOT NULL,
	`subtitle_id` text,
	`page` integer,
	`question_number` real,
	`answer` text,
	`problem_type` text,
	`grade_id` text,
	`semester` text,
	`creator_id` text NOT NULL,
	`major_chapter_id` text,
	`middle_chapter_id` text,
	`core_concept_id` text,
	`problem_category` text,
	`difficulty` text,
	`score` text,
	`question_text` text,
	`solution_text` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	`updated_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	FOREIGN KEY (`subtitle_id`) REFERENCES `subtitles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `problem_tag` (
	`problem_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`problem_id`, `tag_id`),
	FOREIGN KEY (`problem_id`) REFERENCES `problem`(`problem_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tag`(`tag_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `subtitles` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`folder_id` text,
	FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`tag_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tag_type` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);