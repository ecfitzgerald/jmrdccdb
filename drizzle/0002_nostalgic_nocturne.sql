CREATE TABLE `train_decoder_compat` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`train_id` integer NOT NULL,
	`decoder_id` integer NOT NULL,
	`confirmed` integer DEFAULT true NOT NULL,
	`notes` text,
	FOREIGN KEY (`train_id`) REFERENCES `trains`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`decoder_id`) REFERENCES `decoders`(`id`) ON UPDATE no action ON DELETE cascade
);
