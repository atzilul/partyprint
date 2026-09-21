CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`cover_image` text DEFAULT '' NOT NULL,
	`cover_alt` text DEFAULT '' NOT NULL,
	`inline_image_1` text DEFAULT '' NOT NULL,
	`inline_image_1_alt` text DEFAULT '' NOT NULL,
	`inline_image_2` text DEFAULT '' NOT NULL,
	`inline_image_2_alt` text DEFAULT '' NOT NULL,
	`seo_title` text DEFAULT '' NOT NULL,
	`seo_description` text DEFAULT '' NOT NULL,
	`keywords` text DEFAULT '[]' NOT NULL,
	`faqs` text DEFAULT '[]' NOT NULL,
	`internal_links` text DEFAULT '[]' NOT NULL,
	`author` text DEFAULT 'PARTYPRINT' NOT NULL,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);
--> statement-breakpoint
CREATE INDEX `blog_posts_status_published` ON `blog_posts` (`status`,`published_at`);
--> statement-breakpoint
CREATE INDEX `blog_posts_updated` ON `blog_posts` (`updated_at`);
