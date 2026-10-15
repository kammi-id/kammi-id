CREATE TABLE "verification_access_log" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"key_id" uuid,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"outcome" text NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "verification_key" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"secret_hash" text NOT NULL CONSTRAINT "verification_key_secret_hash_unique" UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification_rate_window" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"key_id" uuid NOT NULL,
	"window_started_at" timestamp NOT NULL,
	"request_count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "verification_rate_window_key_window_unique" UNIQUE("key_id","window_started_at")
);
--> statement-breakpoint
ALTER TABLE "verification_access_log" ADD CONSTRAINT "verification_access_log_key_id_verification_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "verification_key"("id");--> statement-breakpoint
ALTER TABLE "verification_rate_window" ADD CONSTRAINT "verification_rate_window_key_id_verification_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "verification_key"("id");