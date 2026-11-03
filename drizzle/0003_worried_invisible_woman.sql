CREATE TABLE `calendar_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#3666F5' NOT NULL,
	`kind` text DEFAULT 'event' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_categories_name_unique` ON `calendar_categories` (`name`);--> statement-breakpoint
CREATE TABLE `calendar_import_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`import_id` text NOT NULL,
	`row_number` integer NOT NULL,
	`entry_id` text,
	`action` text NOT NULL,
	`guard` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`import_id`) REFERENCES `calendar_imports`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `calendar_import_row_unique` ON `calendar_import_rows` (`import_id`,`row_number`);--> statement-breakpoint
CREATE TABLE `calendar_imports` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`source_id` text,
	`name` text NOT NULL,
	`format` text NOT NULL,
	`file_hash` text NOT NULL,
	`payload` text NOT NULL,
	`state` text DEFAULT 'staged' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`report` text,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`source_id`) REFERENCES `calendar_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `calendar_import_hash` ON `calendar_imports` (`file_hash`);--> statement-breakpoint
CREATE TABLE `calendar_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`last_fetched_at` text,
	`last_status` text,
	`actor_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `entries` ADD `all_day` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `time_zone` text DEFAULT 'Europe/Berlin' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `audience` text DEFAULT 'Alle' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `visibility` text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE `entries` ADD `rrule` text;--> statement-breakpoint
ALTER TABLE `entries` ADD `external_id` text;--> statement-breakpoint
ALTER TABLE `entries` ADD `calendar_source_id` text;--> statement-breakpoint
CREATE INDEX `entries_external_event` ON `entries` (`external_id`);
--> statement-breakpoint
INSERT INTO calendar_categories (id,name,color,kind,version) VALUES ('calendar-0','Elternabende','#3666F5','event',1),('calendar-1','Prüfungen','#3666F5','event',1),('calendar-2','Projekte','#3666F5','event',1),('calendar-3','Wandertage','#3666F5','event',1),('calendar-4','Ferien','#3666F5','vacation',1),('calendar-5','Feiertage','#3666F5','holiday',1),('calendar-6','Schulfeste','#3666F5','event',1),('calendar-7','Berufsorientierung','#3666F5','event',1),('calendar-8','Allgemeine Termine','#3666F5','event',1);
