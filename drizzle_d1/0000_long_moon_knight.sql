CREATE TABLE `core_concepts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `core_concepts_name_unique` ON `core_concepts` (`name`);--> statement-breakpoint
CREATE TABLE `major_chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `major_chapters_name_unique` ON `major_chapters` (`name`);--> statement-breakpoint
CREATE TABLE `middle_chapters` (
	`id` text PRIMARY KEY NOT NULL,
	`major_chapter_id` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `problem_set` (
	`problem_set_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`grade` text,
	`semester` text,
	`avg_difficulty` text,
	`cover_image` text,
	`description` text,
	`published_year` integer,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	`updated_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);
--> statement-breakpoint
CREATE TABLE `problem` (
	`problem_id` text PRIMARY KEY NOT NULL,
	`source` text,
	`page` integer,
	`question_number` real,
	`answer` text,
	`problem_type` text,
	`grade` text,
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
	`updated_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
);
--> statement-breakpoint
CREATE TABLE `problem_tag` (
	`problem_id` text NOT NULL,
	`tag_id` text NOT NULL,
	PRIMARY KEY(`problem_id`, `tag_id`)
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`tag_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`tag_type` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);