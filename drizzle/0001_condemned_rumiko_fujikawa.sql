CREATE TABLE `design_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`base_version` integer NOT NULL,
	`state` text DEFAULT 'draft' NOT NULL,
	`actor_id` text,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `design_history` (
	`id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`snapshot` text NOT NULL,
	`actor_id` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `design_history_version_unique` ON `design_history` (`version`);--> statement-breakpoint
ALTER TABLE `entries` ADD `blocks` text;--> statement-breakpoint
ALTER TABLE `entries` ADD `draft` text;--> statement-breakpoint
ALTER TABLE `entries` ADD `draft_status` text DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `media` ADD `metadata` text;--> statement-breakpoint
ALTER TABLE `settings` ADD `version` integer DEFAULT 1 NOT NULL;