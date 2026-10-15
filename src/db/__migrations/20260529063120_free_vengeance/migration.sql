CREATE TABLE "member" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"phone" text,
	"address_province" text,
	"address_city" text,
	"address_district" text,
	"address_subdistrict" text,
	"address_province_code" text,
	"address_city_code" text,
	"address_district_code" text,
	"address_subdistrict_code" text,
	"address_line" text,
	"photo" text,
	"register_number" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"is_alumn" boolean DEFAULT false NOT NULL,
	"is_suspended" boolean DEFAULT false NOT NULL,
	"is_non_active" boolean DEFAULT false NOT NULL,
	"status" text NOT NULL,
	"gender" text NOT NULL,
	"is_certified_mentor" boolean DEFAULT false NOT NULL,
	"is_certified_instructor" boolean DEFAULT false NOT NULL,
	"year_of_entry" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"code" text NOT NULL,
	"code_slug" text GENERATED ALWAYS AS (replace(lower(code), '.', '-')) STORED NOT NULL,
	"type" text NOT NULL,
	"level" integer GENERATED ALWAYS AS (CASE
          WHEN type = 'pp' THEN 1
          WHEN type = 'pw' THEN 2
          WHEN type IN ('pd', 'pdln') THEN 3
          WHEN type = 'pk' THEN 4
          ELSE NULL
        END) STORED NOT NULL,
	"logo" text,
	"parent_id" uuid,
	"is_non_active" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY,
	"secret_hash" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"last_verified_at" timestamp NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_key_organization_id_unique" UNIQUE("key","organization_id")
);
--> statement-breakpoint
CREATE TABLE "training" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"registration_deadline" date,
	"type" text NOT NULL,
	"year" integer GENERATED ALWAYS AS (CAST(EXTRACT(YEAR FROM start_date) AS INTEGER)) STORED,
	"identifier" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_attendants" (
	"training_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"is_passing" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training_instructors" (
	"training_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL UNIQUE,
	"display_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"connected_organization_id" uuid,
	"connected_member_id" uuid
);
--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_parent_id_organization_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "training" ADD CONSTRAINT "training_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "training_attendants" ADD CONSTRAINT "training_attendants_training_id_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "training"("id");--> statement-breakpoint
ALTER TABLE "training_attendants" ADD CONSTRAINT "training_attendants_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "training_instructors" ADD CONSTRAINT "training_instructors_training_id_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "training"("id");--> statement-breakpoint
ALTER TABLE "training_instructors" ADD CONSTRAINT "training_instructors_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_connected_organization_id_organization_id_fkey" FOREIGN KEY ("connected_organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_connected_member_id_member_id_fkey" FOREIGN KEY ("connected_member_id") REFERENCES "member"("id") ON DELETE CASCADE;