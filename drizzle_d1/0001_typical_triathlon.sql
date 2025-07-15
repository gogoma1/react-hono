CREATE TABLE `grades` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`order` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grades_name_unique` ON `grades` (`name`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_problem_set` (
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
	`updated_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_problem_set`("problem_set_id", "name", "creator_id", "type", "status", "copyright_type", "copyright_source", "description", "cover_image", "published_year", "grade_id", "semester", "avg_difficulty", "problem_count", "created_at", "updated_at") SELECT "problem_set_id", "name", "creator_id", "type", "status", "copyright_type", "copyright_source", "description", "cover_image", "published_year", "grade_id", "semester", "avg_difficulty", "problem_count", "created_at", "updated_at" FROM `problem_set`;--> statement-breakpoint
DROP TABLE `problem_set`;--> statement-breakpoint
ALTER TABLE `__new_problem_set` RENAME TO `problem_set`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_problem` (
	`problem_id` text PRIMARY KEY NOT NULL,
	`source_id` text,
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
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grade_id`) REFERENCES `grades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`major_chapter_id`) REFERENCES `major_chapters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`middle_chapter_id`) REFERENCES `middle_chapters`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`core_concept_id`) REFERENCES `core_concepts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_problem`("problem_id", "source_id", "page", "question_number", "answer", "problem_type", "grade_id", "semester", "creator_id", "major_chapter_id", "middle_chapter_id", "core_concept_id", "problem_category", "difficulty", "score", "question_text", "solution_text", "created_at", "updated_at") SELECT "problem_id", "source_id", "page", "question_number", "answer", "problem_type", "grade_id", "semester", "creator_id", "major_chapter_id", "middle_chapter_id", "core_concept_id", "problem_category", "difficulty", "score", "question_text", "solution_text", "created_at", "updated_at" FROM `problem`;--> statement-breakpoint
DROP TABLE `problem`;--> statement-breakpoint
ALTER TABLE `__new_problem` RENAME TO `problem`;