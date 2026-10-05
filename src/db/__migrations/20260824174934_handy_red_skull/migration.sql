CREATE TABLE "organization_account_password_reset" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"event_type" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_username" text NOT NULL,
	"target_account_id" uuid NOT NULL,
	"target_username" text NOT NULL,
	"target_role" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"organization_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
