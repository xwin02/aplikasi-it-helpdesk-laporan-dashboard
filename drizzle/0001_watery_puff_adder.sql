ALTER TABLE `tickets` ALTER COLUMN "description" TO "description" text NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ALTER COLUMN "category" TO "category" text NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `requester_name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `requester_email` text NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `assigned_to` text;--> statement-breakpoint
ALTER TABLE `tickets` ADD `resolved_at` text;