ALTER TABLE "organization" ADD COLUMN "non_active_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "non_active_by" uuid;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "state" text GENERATED ALWAYS AS (CASE
          WHEN deleted_at IS NOT NULL THEN 'terhapus'
          WHEN is_non_active THEN 'non_aktif'
          ELSE 'aktif'
        END) STORED;--> statement-breakpoint
--
-- Ditulis tangan, dan wajib tetap ada. `drizzle-kit` membuang `NOT NULL` dari
-- kolom generated yang ditambahkan lewat `ALTER TABLE` (cabang `!generated` di
-- `addColumnConvertor`), jadi tanpa baris ini kolomnya mendarat nullable dan
-- selamanya berselisih dengan skema TS-nya. Regenerasi migrasi ini akan
-- membuangnya lagi — kembalikan.
--
-- Aman tanpa backfill: ekspresinya tidak punya cabang yang menghasilkan NULL.
ALTER TABLE "organization" ALTER COLUMN "state" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_non_active_by_user_id_fkey" FOREIGN KEY ("non_active_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "article_category" DROP CONSTRAINT "article_category_organization_id_organization_id_fkey", ADD CONSTRAINT "article_category_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "article" DROP CONSTRAINT "article_organization_id_organization_id_fkey", ADD CONSTRAINT "article_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "site_settings" DROP CONSTRAINT "site_settings_organization_id_organization_id_fkey", ADD CONSTRAINT "site_settings_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_connected_organization_id_organization_id_fkey", ADD CONSTRAINT "user_connected_organization_id_organization_id_fkey" FOREIGN KEY ("connected_organization_id") REFERENCES "organization"("id");