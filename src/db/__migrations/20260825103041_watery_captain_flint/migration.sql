ALTER TABLE "organization" ADD COLUMN "is_site_active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
--
-- ADR 0012: PP diperlakukan sebagai tenant biasa, apex termasuk. Tanpa baris
-- ini, `kammi.id` mati begitu deploy karena kolomnya mendarat `false` untuk
-- baris PP yang sudah ada seperti baris lainnya. Tidak ada backfill lain —
-- setiap Struktur selain PP tetap belum memiliki Situs Aktif sampai Humas-nya
-- menyalakan sendiri.
UPDATE "organization" SET "is_site_active" = true WHERE "type" = 'pp';