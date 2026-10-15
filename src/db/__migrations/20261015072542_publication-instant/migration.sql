-- Existing values are WIB wall clocks, regardless of the session TimeZone.
ALTER TABLE "article" ALTER COLUMN "published_at" SET DATA TYPE timestamp with time zone USING "published_at" AT TIME ZONE 'Asia/Jakarta';
