CREATE TABLE `dcc_formats` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`pin_count` integer,
	`description` text,
	`sort_order` integer DEFAULT 0
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dcc_formats_name_unique` ON `dcc_formats` (`name`);--> statement-breakpoint
CREATE TABLE `decoder_brands` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`website` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `decoder_brands_name_unique` ON `decoder_brands` (`name`);--> statement-breakpoint
CREATE TABLE `decoders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`brand_id` integer NOT NULL,
	`format_id` integer NOT NULL,
	`model` text NOT NULL,
	`notes` text,
	`buy_url` text,
	`sound_decoder` integer DEFAULT false,
	FOREIGN KEY (`brand_id`) REFERENCES `decoder_brands`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`format_id`) REFERENCES `dcc_formats`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `suggestions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`submitter_note` text,
	`submitter_email` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`admin_note` text,
	`created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE TABLE `train_format_compat` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`train_id` integer NOT NULL,
	`format_id` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`train_id`) REFERENCES `trains`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`format_id`) REFERENCES `dcc_formats`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `trains` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`manufacturer` text NOT NULL,
	`scale` text NOT NULL,
	`road_name` text,
	`model_number` text NOT NULL,
	`name` text NOT NULL,
	`era` text,
	`notes` text,
	`created_at` text DEFAULT (datetime('now'))
);
