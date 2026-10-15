CREATE TABLE "article_permalink_history" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"old_slug" text NOT NULL,
	"old_tahun" integer NOT NULL,
	"old_bulan" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "article_permalink_history_lookup_idx" ON "article_permalink_history" ("organization_id","old_slug");--> statement-breakpoint
CREATE INDEX "article_terbit_kronologis_idx" ON "article" ("organization_id","published_at" DESC NULLS LAST,"id" DESC NULLS LAST) WHERE "type" = 'blog' AND "status" = 'published';--> statement-breakpoint
ALTER TABLE "article_permalink_history" ADD CONSTRAINT "article_permalink_history_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "article_permalink_history" ADD CONSTRAINT "article_permalink_history_article_id_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE;