CREATE TABLE "member_academic" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"member_id" uuid NOT NULL,
	"degree" text NOT NULL,
	"study_program" text NOT NULL,
	"institution_name" text NOT NULL,
	"institution_data" jsonb NOT NULL,
	"year_start" integer NOT NULL,
	"year_end" integer,
	"is_graduated" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_career" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"member_id" uuid NOT NULL,
	"profession" text NOT NULL,
	"company" text NOT NULL,
	"year_start" integer NOT NULL,
	"year_end" integer
);
--> statement-breakpoint
CREATE TABLE "member_organization_history" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"member_id" uuid NOT NULL,
	"position" text NOT NULL,
	"organization" text NOT NULL,
	"year_start" integer NOT NULL,
	"year_end" integer
);
--> statement-breakpoint
ALTER TABLE "member_academic" ADD CONSTRAINT "member_academic_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "member_career" ADD CONSTRAINT "member_career_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "member_organization_history" ADD CONSTRAINT "member_organization_history_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id");