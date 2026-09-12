CREATE TABLE `coupons` (
	`code` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `site_events` (
	`key` text PRIMARY KEY NOT NULL,
	`day` text NOT NULL,
	`kind` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `site_events_day` ON `site_events` (`day`);--> statement-breakpoint
CREATE TABLE `studio_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`data` text NOT NULL
);
