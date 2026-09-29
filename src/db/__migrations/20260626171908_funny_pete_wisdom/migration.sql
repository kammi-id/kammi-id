CREATE TABLE "article_category" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" uuid,
	CONSTRAINT "article_category_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "article" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"body" jsonb NOT NULL,
	"featured_image" text,
	"published_at" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"category_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "article_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
ALTER TABLE "article_category" ADD CONSTRAINT "article_category_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "article_category" ADD CONSTRAINT "article_category_parent_id_article_category_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "article_category"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_category_id_article_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "article_category"("id") ON DELETE RESTRICT;