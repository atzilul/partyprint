CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`data` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `orders_status_created` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `orders_created` ON `orders` (`created_at`);