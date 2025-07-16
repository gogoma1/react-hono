CREATE TABLE `folders` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`creator_id` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now'))
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
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_problem` (
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
INSERT INTO `__new_problem`("problem_id", "subtitle_id", "page", "question_number", "answer", "problem_type", "grade_id", "semester", "creator_id", "major_chapter_id", "middle_chapter_id", "core_concept_id", "problem_category", "difficulty", "score", "question_text", "solution_text", "created_at", "updated_at") SELECT "problem_id", "subtitle_id", "page", "question_number", "answer", "problem_type", "grade_id", "semester", "creator_id", "major_chapter_id", "middle_chapter_id", "core_concept_id", "problem_category", "difficulty", "score", "question_text", "solution_text", "created_at", "updated_at" FROM `problem`;--> statement-breakpoint
DROP TABLE `problem`;--> statement-breakpoint
ALTER TABLE `__new_problem` RENAME TO `problem`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
ALTER TABLE `problem_set` ADD `folder_id` text REFERENCES folders(id);--> statement-breakpoint
ALTER TABLE `subtitles` ADD `folder_id` text REFERENCES folders(id);