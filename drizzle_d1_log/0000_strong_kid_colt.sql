CREATE TABLE `student_problem_results` (
	`assignment_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`student_id` text NOT NULL,
	`is_correct` integer,
	`time_taken_seconds` integer NOT NULL,
	`submitted_answer` text,
	`meta_cognition_status` text,
	`answer_change_count` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%d %H:%M:%f', 'now')),
	PRIMARY KEY(`assignment_id`, `problem_id`)
);
--> statement-breakpoint
CREATE INDEX `student_id_idx` ON `student_problem_results` (`student_id`);