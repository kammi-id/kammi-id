DO $$ BEGIN IF EXISTS (SELECT 1 FROM article WHERE type = 'page' AND slug = 'events') THEN RAISE EXCEPTION 'Halaman /events sudah ada; ubah permalink Halaman tersebut sebelum migrasi Events.'; END IF; END $$;
--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "event_starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "event_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "event_timezone" text;--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "event_location" text;--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "event_url" text;--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "event_cancelled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "article_event_upcoming_idx" ON "article" ("organization_id","event_starts_at","id") WHERE "type" = 'event' AND "status" = 'published';