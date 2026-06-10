CREATE TABLE `train_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`sort_order` integer DEFAULT 0,
	UNIQUE(`name`)
);
--> statement-breakpoint
ALTER TABLE `trains` ADD `type_id` integer REFERENCES `train_types`(`id`);
--> statement-breakpoint
ALTER TABLE `trains` DROP COLUMN `type`;
