CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`customer_name` text DEFAULT '' NOT NULL,
	`customer_email` text DEFAULT '' NOT NULL,
	`order_id` text,
	`assignee_email` text,
	`assignee_name` text,
	`created_by_email` text NOT NULL,
	`created_by_name` text NOT NULL,
	`due_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tickets_status_updated` ON `tickets` (`status`,`updated_at`);
--> statement-breakpoint
CREATE INDEX `tickets_assignee_status` ON `tickets` (`assignee_email`,`status`);
--> statement-breakpoint
CREATE INDEX `tickets_order` ON `tickets` (`order_id`);
--> statement-breakpoint
CREATE TABLE `ticket_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_id` text NOT NULL,
	`author_email` text NOT NULL,
	`author_name` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ticket_messages_ticket_created` ON `ticket_messages` (`ticket_id`,`created_at`);
