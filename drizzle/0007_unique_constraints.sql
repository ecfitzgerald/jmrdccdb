CREATE UNIQUE INDEX `idx_decoders_brand_model` ON `decoders` (`brand_id`, `model`);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_train_format_compat_train_format` ON `train_format_compat` (`train_id`, `format_id`);
