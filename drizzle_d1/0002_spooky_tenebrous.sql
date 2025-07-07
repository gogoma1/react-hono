CREATE TABLE `problem_set_problems` (
	`problem_set_id` text NOT NULL,
	`problem_id` text NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`problem_set_id`, `problem_id`)
);
