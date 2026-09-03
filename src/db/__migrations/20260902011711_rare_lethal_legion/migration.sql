CREATE TABLE "member_mutation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"member_id" uuid NOT NULL,
	"from_organization_id" uuid NOT NULL,
	"to_organization_id" uuid NOT NULL,
	"moved_at" timestamp DEFAULT now() NOT NULL,
	"moved_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "register_number_sequence" (
	"prefix" text PRIMARY KEY,
	"last_seq" integer NOT NULL
);
--> statement-breakpoint
-- Seed the high-water mark from every NIA ever issued, deleted_at included
-- (ADR 0020): a number already printed on a since-deleted row must still
-- never be handed out again.
INSERT INTO "register_number_sequence" ("prefix", "last_seq")
SELECT substring(register_number from 1 for 8) AS prefix,
       MAX(substring(register_number from 9)::int) AS last_seq
FROM "member"
WHERE register_number ~ '^.{8}[0-9]+$'
GROUP BY substring(register_number from 1 for 8);
--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_register_number_unique" UNIQUE("register_number");--> statement-breakpoint
ALTER TABLE "member_mutation" ADD CONSTRAINT "member_mutation_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "member_mutation" ADD CONSTRAINT "member_mutation_from_organization_id_organization_id_fkey" FOREIGN KEY ("from_organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "member_mutation" ADD CONSTRAINT "member_mutation_to_organization_id_organization_id_fkey" FOREIGN KEY ("to_organization_id") REFERENCES "organization"("id");