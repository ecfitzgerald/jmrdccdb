CREATE TABLE `operators` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `trains` ADD `operator_id` integer REFERENCES `operators`(`id`);
--> statement-breakpoint
ALTER TABLE `trains` DROP COLUMN `road_name`;
