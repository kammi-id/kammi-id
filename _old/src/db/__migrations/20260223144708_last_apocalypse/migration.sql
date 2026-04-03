CREATE TABLE "manager" (
	"managerial_period_id" uuid,
	"manager_id" uuid,
	"role" text NOT NULL,
	"role_title" text,
	"department" text,
	"sub_department" text,
	"isDailyManager" boolean,
	CONSTRAINT "manager_pkey" PRIMARY KEY("managerial_period_id","manager_id")
);
--> statement-breakpoint
CREATE TABLE "managerial_period" (
	"id" uuid PRIMARY KEY,
	"organization_id" uuid NOT NULL,
	"year_start" smallint NOT NULL,
	"year_end" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" uuid PRIMARY KEY,
	"id_number" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"birth_place" text NOT NULL,
	"birth_date" date NOT NULL,
	"phone" text,
	"photo" text,
	"gender" text NOT NULL,
	"address_province" text NOT NULL,
	"address_province_code" text NOT NULL,
	"address_city" text NOT NULL,
	"address_city_code" text NOT NULL,
	"address_district" text,
	"address_district_code" text,
	"address_subdistrict" text,
	"address_subdistrict_code" text,
	"address_line" text,
	"address_full" text GENERATED ALWAYS AS (
        coalesce("member"."address_line" || ', ', '') ||
        coalesce('Desa/Kel. ' || "member"."address_subdistrict" || ', ', '') ||
        coalesce('Kec. ' || "member"."address_district" || ', ', '') ||
        coalesce("member"."address_city" || ', ', '') ||
        "member"."address_province"
      ) STORED,
	"is_an_alumn" boolean DEFAULT false,
	"is_suspended" boolean DEFAULT false,
	"registered_at_organization_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_career" (
	"member_id" uuid,
	"type" text NOT NULL,
	"employer_id" text,
	"employer_name" text NOT NULL,
	"position" text,
	"year_start" smallint NOT NULL,
	"year_end" smallint,
	CONSTRAINT "member_career_pkey" PRIMARY KEY("member_id","employer_id","position")
);
--> statement-breakpoint
CREATE TABLE "member_education" (
	"member_id" uuid,
	"type" text,
	"institution_id" text,
	"institution_name" text NOT NULL,
	"major" text,
	"year_start" smallint NOT NULL,
	"year_end" smallint,
	CONSTRAINT "member_education_pkey" PRIMARY KEY("member_id","type","institution_id","major")
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"code" text NOT NULL UNIQUE,
	"code_slug" text GENERATED ALWAYS AS (lower(replace("organization"."code", '.', '-'))) STORED NOT NULL UNIQUE,
	"type" text NOT NULL,
	"level" smallint GENERATED ALWAYS AS (
        case "organization"."type"
          when 'pp' then 1
          when 'pw' then 2
          when 'pd' then 3
          when 'pdln' then 3
          when 'pk' then 4
        end
      ) STORED NOT NULL,
	"logo" text,
	"is_active" boolean DEFAULT true,
	"parent_id" uuid
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY,
	"secret_hash" text NOT NULL,
	"created_at" bigint NOT NULL,
	"last_verified_at" bigint NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "training" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"date_start" date NOT NULL,
	"date_end" date NOT NULL,
	"registration_until" date,
	"organizer_id" uuid
);
--> statement-breakpoint
CREATE TABLE "training_attendants" (
	"training_id" uuid,
	"attendant_id" uuid,
	"is_passing" boolean DEFAULT false,
	"is_admitted" boolean DEFAULT false,
	CONSTRAINT "training_attendants_pkey" PRIMARY KEY("training_id","attendant_id")
);
--> statement-breakpoint
CREATE TABLE "training_instructors" (
	"training_id" uuid,
	"instructor_id" uuid,
	"role" text,
	"is_intern" boolean DEFAULT false,
	CONSTRAINT "training_instructors_pkey" PRIMARY KEY("training_id","instructor_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"display_name" text,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"connected_organization_id" uuid,
	"connected_member_id" uuid
);
--> statement-breakpoint
CREATE INDEX "manager_managerial_period_id_idx" ON "manager" ("managerial_period_id");--> statement-breakpoint
CREATE INDEX "manager_manager_id_idx" ON "manager" ("manager_id");--> statement-breakpoint
CREATE INDEX "managerial_period_organization_id_idx" ON "managerial_period" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_registered_at_organization_id_idx" ON "member" ("registered_at_organization_id");--> statement-breakpoint
CREATE INDEX "member_gender_idx" ON "member" ("gender");--> statement-breakpoint
CREATE INDEX "member_name_gin_idx" ON "member" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "member_id_number_gin_idx" ON "member" USING gin ("id_number" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "member_career_type_idx" ON "member_career" ("type");--> statement-breakpoint
CREATE INDEX "member_career_employer_id_idx" ON "member_career" ("employer_id");--> statement-breakpoint
CREATE INDEX "member_career_employer_name_gin_idx" ON "member_career" USING gin ("employer_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "member_career_position_gin_idx" ON "member_career" USING gin ("position" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "member_education_type_idx" ON "member_education" ("type");--> statement-breakpoint
CREATE INDEX "member_education_institution_id_idx" ON "member_education" ("institution_id");--> statement-breakpoint
CREATE INDEX "member_education_institution_name_gin_idx" ON "member_education" USING gin ("institution_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "member_education_major_gin_idx" ON "member_education" USING gin ("major" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "organization_parent_id_idx" ON "organization" ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_code_idx" ON "organization" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_code_slug_idx" ON "organization" ("code_slug");--> statement-breakpoint
CREATE INDEX "organization_name_gin_idx" ON "organization" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "session_last_verified_at_idx" ON "session" ("last_verified_at");--> statement-breakpoint
CREATE INDEX "training_organizer_id_idx" ON "training" ("organizer_id");--> statement-breakpoint
CREATE INDEX "training_date_start_idx" ON "training" ("date_start");--> statement-breakpoint
CREATE INDEX "training_date_end_idx" ON "training" ("date_end");--> statement-breakpoint
CREATE INDEX "training_type_idx" ON "training" ("type");--> statement-breakpoint
CREATE INDEX "training_name_gin_idx" ON "training" USING gin ("name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "training_attendants_training_id_idx" ON "training_attendants" ("training_id");--> statement-breakpoint
CREATE INDEX "training_attendants_attendant_id_idx" ON "training_attendants" ("attendant_id");--> statement-breakpoint
CREATE INDEX "training_instructors_training_id_idx" ON "training_instructors" ("training_id");--> statement-breakpoint
CREATE INDEX "training_instructors_instructor_id_idx" ON "training_instructors" ("instructor_id");--> statement-breakpoint
CREATE INDEX "user_connected_organization_id_idx" ON "user" ("connected_organization_id");--> statement-breakpoint
CREATE INDEX "user_connected_member_id_idx" ON "user" ("connected_member_id");--> statement-breakpoint
ALTER TABLE "manager" ADD CONSTRAINT "manager_managerial_period_id_managerial_period_id_fkey" FOREIGN KEY ("managerial_period_id") REFERENCES "managerial_period"("id");--> statement-breakpoint
ALTER TABLE "manager" ADD CONSTRAINT "manager_manager_id_member_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "managerial_period" ADD CONSTRAINT "managerial_period_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_registered_at_organization_id_organization_id_fkey" FOREIGN KEY ("registered_at_organization_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "member_career" ADD CONSTRAINT "member_career_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "member_education" ADD CONSTRAINT "member_education_member_id_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_parent_id_organization_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id");--> statement-breakpoint
ALTER TABLE "training" ADD CONSTRAINT "training_organizer_id_organization_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organization"("id");--> statement-breakpoint
ALTER TABLE "training_attendants" ADD CONSTRAINT "training_attendants_training_id_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "training"("id");--> statement-breakpoint
ALTER TABLE "training_attendants" ADD CONSTRAINT "training_attendants_attendant_id_member_id_fkey" FOREIGN KEY ("attendant_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "training_instructors" ADD CONSTRAINT "training_instructors_training_id_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "training"("id");--> statement-breakpoint
ALTER TABLE "training_instructors" ADD CONSTRAINT "training_instructors_instructor_id_member_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "member"("id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_connected_organization_id_organization_id_fkey" FOREIGN KEY ("connected_organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_connected_member_id_member_id_fkey" FOREIGN KEY ("connected_member_id") REFERENCES "member"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE VIEW "session_view" AS (with "session_cte" as (with "user_cte" as (with "member_cte" as (with "member_status_cte" as (with "training_serial_cte" as (select "id", 
        (extract(year from "date_start")::text ||
        lpad(row_number() over (
          partition by "organizer_id", extract(year from "date_start")
          order by "date_start" asc, "id" asc
        )::text, 3, '0'))
       as "serial" from "training") select "member"."id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "training"."id",
              'name', "training"."name",
              'type', "training"."type",
              'dateStart', "training"."date_start",
              'dateEnd', "training"."date_end",
              'serial', "training_serial_cte"."serial",
              'isPassing', "training_attendants"."is_passing"
            )
          ) filter (where "training"."id" is not null),
          '[]'::json
        )
       as "trainings", 
        case
          max(
            case
              when "training"."type" = 'dm3' and "training_attendants"."is_passing" = true then 3
              when "training"."type" = 'dm2' and "training_attendants"."is_passing" = true then 2
              when "training"."type" = 'dm1' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 3 then 'ab3'
            when 2 then 'ab2'
            when 1 then 'ab1'
            else null
        end
       as "status", 
        case
          max(
            case
              when "training"."type" = 'dpmk' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_mentor", 
        case
          max(
            case
              when "training"."type" = 'tfi' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_instructor" from "member" left join "training_attendants" on "member"."id" = "training_attendants"."attendant_id" left join "training" on "training_attendants"."training_id" = "training"."id" left join "training_serial_cte" on "training"."id" = "training_serial_cte"."id" group by "member"."id"), "member_education_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'institutionId', "institution_id",
              'institutionName', "institution_name",
              'major', "major",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "educations" from "member_education" group by "member_education"."member_id"), "member_career_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'employerId', "employer_id",
              'employerName', "employer_name",
              'position', "position",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "careers" from "member_career" group by "member_career"."member_id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "member"."id", "member"."id_number", "member"."name", "member"."birth_place", "member"."birth_date", "member"."phone", "member"."photo", "member"."gender", "member"."address_province", "member"."address_province_code", "member"."address_city", "member"."address_city_code", "member"."address_district", "member"."address_district_code", "member"."address_subdistrict", "member"."address_subdistrict_code", "member"."address_line", "member"."address_full", "member"."is_an_alumn", "member"."is_suspended", "member_status_cte"."trainings", "member_status_cte"."status", "member_education_cte"."educations", "member_career_cte"."careers", "member_status_cte"."is_certified_mentor", "member_status_cte"."is_certified_instructor", 
          json_build_object(
            'id', "organization_with_hierarchy_cte"."id",
            'name', "organization_with_hierarchy_cte"."name",
            'slug', "organization_with_hierarchy_cte"."slug",
            'code', "organization_with_hierarchy_cte"."code",
            'codeSlug', "organization_with_hierarchy_cte"."code_slug",
            'type', "organization_with_hierarchy_cte"."type",
            'level', "organization_with_hierarchy_cte"."level",
            'logo', "organization_with_hierarchy_cte"."logo",
            'isActive', "organization_with_hierarchy_cte"."is_active",
            'pd', "organization_with_hierarchy_cte"."pd",
            'pdln', "organization_with_hierarchy_cte"."pdln",
            'pw', "organization_with_hierarchy_cte"."pw"
          )
         as "registered_at", "organization_with_hierarchy_cte"."scope_id" from "member" left join "member_status_cte" on "member"."id" = "member_status_cte"."id" left join "member_education_cte" on "member"."id" = "member_education_cte"."member_id" left join "member_career_cte" on "member"."id" = "member_career_cte"."member_id" left join "organization_with_hierarchy_cte" on "member"."registered_at_organization_id" = "organization_with_hierarchy_cte"."id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "user"."id", "user"."name", "user"."display_name", "user"."role", 
        case
          when "member_cte"."id" is not null then
            json_build_object(
              'id', "member_cte"."id",
              'idNo', "member_cte"."id_number",
              'name', "member_cte"."name",
              'photo', "member_cte"."photo",
              'gender', "member_cte"."gender",
              'status', "member_cte"."status",
              'educations', "member_cte"."educations",
              'careers', "member_cte"."careers",
              'isCertifiedMentor', "member_cte"."is_certified_mentor",
              'isCertifiedInstructor', "member_cte"."is_certified_instructor",
              'registeredAt', "member_cte"."registered_at"
            )
          else null
        end
       as "connected_member", 
        case
          when "organization_with_hierarchy_cte"."id" is not null then
            json_build_object(
              'id', "organization_with_hierarchy_cte"."id",
              'name', "organization_with_hierarchy_cte"."name",
              'slug', "organization_with_hierarchy_cte"."slug",
              'code', "organization_with_hierarchy_cte"."code",
              'codeSlug', "organization_with_hierarchy_cte"."code_slug",
              'type', "organization_with_hierarchy_cte"."type",
              'level', "organization_with_hierarchy_cte"."level",
              'logo', "organization_with_hierarchy_cte"."logo",
              'isActive', "organization_with_hierarchy_cte"."is_active",
              'pd', "organization_with_hierarchy_cte"."pd",
              'pdln', "organization_with_hierarchy_cte"."pdln",
              'pw', "organization_with_hierarchy_cte"."pw"
            )
          else null
        end
       as "connected_organization" from "user" left join "member_cte" on "user"."connected_member_id" = "member_cte"."id" left join "organization_with_hierarchy_cte" on "user"."connected_organization_id" = "organization_with_hierarchy_cte"."id") select "session"."id", "session"."secret_hash", "session"."created_at", "session"."last_verified_at", "session"."user_id", 
        json_build_object(
          'id', "user_cte"."id",
          'name', "user_cte"."name",
          'displayName', "user_cte"."display_name",
          'role', "user_cte"."role",
          'connectedMember', "user_cte"."connected_member",
          'connectedOrganization', "user_cte"."connected_organization"
        )
       as "user" from "session" left join "user_cte" on "session"."user_id" = "user_cte"."id") select "id", "secret_hash", "created_at", "last_verified_at", "user_id", "user" from "session_cte");--> statement-breakpoint
CREATE VIEW "user_view" AS (with "user_cte" as (with "member_cte" as (with "member_status_cte" as (with "training_serial_cte" as (select "id", 
        (extract(year from "date_start")::text ||
        lpad(row_number() over (
          partition by "organizer_id", extract(year from "date_start")
          order by "date_start" asc, "id" asc
        )::text, 3, '0'))
       as "serial" from "training") select "member"."id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "training"."id",
              'name', "training"."name",
              'type', "training"."type",
              'dateStart', "training"."date_start",
              'dateEnd', "training"."date_end",
              'serial', "training_serial_cte"."serial",
              'isPassing', "training_attendants"."is_passing"
            )
          ) filter (where "training"."id" is not null),
          '[]'::json
        )
       as "trainings", 
        case
          max(
            case
              when "training"."type" = 'dm3' and "training_attendants"."is_passing" = true then 3
              when "training"."type" = 'dm2' and "training_attendants"."is_passing" = true then 2
              when "training"."type" = 'dm1' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 3 then 'ab3'
            when 2 then 'ab2'
            when 1 then 'ab1'
            else null
        end
       as "status", 
        case
          max(
            case
              when "training"."type" = 'dpmk' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_mentor", 
        case
          max(
            case
              when "training"."type" = 'tfi' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_instructor" from "member" left join "training_attendants" on "member"."id" = "training_attendants"."attendant_id" left join "training" on "training_attendants"."training_id" = "training"."id" left join "training_serial_cte" on "training"."id" = "training_serial_cte"."id" group by "member"."id"), "member_education_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'institutionId', "institution_id",
              'institutionName', "institution_name",
              'major', "major",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "educations" from "member_education" group by "member_education"."member_id"), "member_career_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'employerId', "employer_id",
              'employerName', "employer_name",
              'position', "position",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "careers" from "member_career" group by "member_career"."member_id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "member"."id", "member"."id_number", "member"."name", "member"."birth_place", "member"."birth_date", "member"."phone", "member"."photo", "member"."gender", "member"."address_province", "member"."address_province_code", "member"."address_city", "member"."address_city_code", "member"."address_district", "member"."address_district_code", "member"."address_subdistrict", "member"."address_subdistrict_code", "member"."address_line", "member"."address_full", "member"."is_an_alumn", "member"."is_suspended", "member_status_cte"."trainings", "member_status_cte"."status", "member_education_cte"."educations", "member_career_cte"."careers", "member_status_cte"."is_certified_mentor", "member_status_cte"."is_certified_instructor", 
          json_build_object(
            'id', "organization_with_hierarchy_cte"."id",
            'name', "organization_with_hierarchy_cte"."name",
            'slug', "organization_with_hierarchy_cte"."slug",
            'code', "organization_with_hierarchy_cte"."code",
            'codeSlug', "organization_with_hierarchy_cte"."code_slug",
            'type', "organization_with_hierarchy_cte"."type",
            'level', "organization_with_hierarchy_cte"."level",
            'logo', "organization_with_hierarchy_cte"."logo",
            'isActive', "organization_with_hierarchy_cte"."is_active",
            'pd', "organization_with_hierarchy_cte"."pd",
            'pdln', "organization_with_hierarchy_cte"."pdln",
            'pw', "organization_with_hierarchy_cte"."pw"
          )
         as "registered_at", "organization_with_hierarchy_cte"."scope_id" from "member" left join "member_status_cte" on "member"."id" = "member_status_cte"."id" left join "member_education_cte" on "member"."id" = "member_education_cte"."member_id" left join "member_career_cte" on "member"."id" = "member_career_cte"."member_id" left join "organization_with_hierarchy_cte" on "member"."registered_at_organization_id" = "organization_with_hierarchy_cte"."id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "user"."id", "user"."name", "user"."display_name", "user"."role", 
        case
          when "member_cte"."id" is not null then
            json_build_object(
              'id', "member_cte"."id",
              'idNo', "member_cte"."id_number",
              'name', "member_cte"."name",
              'photo', "member_cte"."photo",
              'gender', "member_cte"."gender",
              'status', "member_cte"."status",
              'educations', "member_cte"."educations",
              'careers', "member_cte"."careers",
              'isCertifiedMentor', "member_cte"."is_certified_mentor",
              'isCertifiedInstructor', "member_cte"."is_certified_instructor",
              'registeredAt', "member_cte"."registered_at"
            )
          else null
        end
       as "connected_member", 
        case
          when "organization_with_hierarchy_cte"."id" is not null then
            json_build_object(
              'id', "organization_with_hierarchy_cte"."id",
              'name', "organization_with_hierarchy_cte"."name",
              'slug', "organization_with_hierarchy_cte"."slug",
              'code', "organization_with_hierarchy_cte"."code",
              'codeSlug', "organization_with_hierarchy_cte"."code_slug",
              'type', "organization_with_hierarchy_cte"."type",
              'level', "organization_with_hierarchy_cte"."level",
              'logo', "organization_with_hierarchy_cte"."logo",
              'isActive', "organization_with_hierarchy_cte"."is_active",
              'pd', "organization_with_hierarchy_cte"."pd",
              'pdln', "organization_with_hierarchy_cte"."pdln",
              'pw', "organization_with_hierarchy_cte"."pw"
            )
          else null
        end
       as "connected_organization" from "user" left join "member_cte" on "user"."connected_member_id" = "member_cte"."id" left join "organization_with_hierarchy_cte" on "user"."connected_organization_id" = "organization_with_hierarchy_cte"."id") select "id", "name", "display_name", "role", "connected_member", "connected_organization" from "user_cte");--> statement-breakpoint
CREATE MATERIALIZED VIEW "managers_history_view" AS (with "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id"), "organization_managerial_summary_cte" as (with "managerial_period_cte" as (with "member_cte" as (with "member_status_cte" as (with "training_serial_cte" as (select "id", 
        (extract(year from "date_start")::text ||
        lpad(row_number() over (
          partition by "organizer_id", extract(year from "date_start")
          order by "date_start" asc, "id" asc
        )::text, 3, '0'))
       as "serial" from "training") select "member"."id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "training"."id",
              'name', "training"."name",
              'type', "training"."type",
              'dateStart', "training"."date_start",
              'dateEnd', "training"."date_end",
              'serial', "training_serial_cte"."serial",
              'isPassing', "training_attendants"."is_passing"
            )
          ) filter (where "training"."id" is not null),
          '[]'::json
        )
       as "trainings", 
        case
          max(
            case
              when "training"."type" = 'dm3' and "training_attendants"."is_passing" = true then 3
              when "training"."type" = 'dm2' and "training_attendants"."is_passing" = true then 2
              when "training"."type" = 'dm1' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 3 then 'ab3'
            when 2 then 'ab2'
            when 1 then 'ab1'
            else null
        end
       as "status", 
        case
          max(
            case
              when "training"."type" = 'dpmk' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_mentor", 
        case
          max(
            case
              when "training"."type" = 'tfi' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_instructor" from "member" left join "training_attendants" on "member"."id" = "training_attendants"."attendant_id" left join "training" on "training_attendants"."training_id" = "training"."id" left join "training_serial_cte" on "training"."id" = "training_serial_cte"."id" group by "member"."id"), "member_education_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'institutionId', "institution_id",
              'institutionName', "institution_name",
              'major', "major",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "educations" from "member_education" group by "member_education"."member_id"), "member_career_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'employerId', "employer_id",
              'employerName', "employer_name",
              'position', "position",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "careers" from "member_career" group by "member_career"."member_id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "member"."id", "member"."id_number", "member"."name", "member"."birth_place", "member"."birth_date", "member"."phone", "member"."photo", "member"."gender", "member"."address_province", "member"."address_province_code", "member"."address_city", "member"."address_city_code", "member"."address_district", "member"."address_district_code", "member"."address_subdistrict", "member"."address_subdistrict_code", "member"."address_line", "member"."address_full", "member"."is_an_alumn", "member"."is_suspended", "member_status_cte"."trainings", "member_status_cte"."status", "member_education_cte"."educations", "member_career_cte"."careers", "member_status_cte"."is_certified_mentor", "member_status_cte"."is_certified_instructor", 
          json_build_object(
            'id', "organization_with_hierarchy_cte"."id",
            'name', "organization_with_hierarchy_cte"."name",
            'slug', "organization_with_hierarchy_cte"."slug",
            'code', "organization_with_hierarchy_cte"."code",
            'codeSlug', "organization_with_hierarchy_cte"."code_slug",
            'type', "organization_with_hierarchy_cte"."type",
            'level', "organization_with_hierarchy_cte"."level",
            'logo', "organization_with_hierarchy_cte"."logo",
            'isActive', "organization_with_hierarchy_cte"."is_active",
            'pd', "organization_with_hierarchy_cte"."pd",
            'pdln', "organization_with_hierarchy_cte"."pdln",
            'pw', "organization_with_hierarchy_cte"."pw"
          )
         as "registered_at", "organization_with_hierarchy_cte"."scope_id" from "member" left join "member_status_cte" on "member"."id" = "member_status_cte"."id" left join "member_education_cte" on "member"."id" = "member_education_cte"."member_id" left join "member_career_cte" on "member"."id" = "member_career_cte"."member_id" left join "organization_with_hierarchy_cte" on "member"."registered_at_organization_id" = "organization_with_hierarchy_cte"."id") select "managerial_period"."id", "managerial_period"."organization_id", "managerial_period"."year_start", "managerial_period"."year_end", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "member_cte"."id",
              'idNo', "member_cte"."id_number",
              'name', "member_cte"."name",
              'phone', "member_cte"."phone",
              'photo', "member_cte"."photo",
              'gender', "member_cte"."gender",
              'status', "member_cte"."status",
              'role', "manager"."role",
              'roleTitle', "manager"."role_title",
              'department', "manager"."department",
              'subDepartment', "manager"."sub_department",
              'isDailyManager', "manager"."isDailyManager"
            )
          ) filter (where "member_cte"."id" is not null),
          '[]'::json
        )
       as "managers" from "managerial_period" left join "manager" on "managerial_period"."id" = "manager"."managerial_period_id" left join "member_cte" on "manager"."manager_id" = "member_cte"."id" group by "managerial_period"."id") select "organization_id", 
          coalesce(
            json_agg(
              json_build_object(
                'id', "id",
                'yearStart', "year_start",
                'yearEnd', "year_end",
                'managers', "managerial_period_cte"."managers"
              )
              order by "year_start" desc
            ),
            '[]'::json
          )
         as "periods" from "managerial_period_cte" group by "managerial_period_cte"."organization_id") select "organization_with_hierarchy_cte"."id", "organization_with_hierarchy_cte"."name", "organization_with_hierarchy_cte"."slug", "organization_with_hierarchy_cte"."code", "organization_with_hierarchy_cte"."code_slug", "organization_with_hierarchy_cte"."type", "organization_with_hierarchy_cte"."logo", 
          coalesce(
            "organization_managerial_summary_cte"."periods",
            '[]'::json
          )
         as "managerial_periods" from "organization_with_hierarchy_cte" inner join "organization_managerial_summary_cte" on "organization_with_hierarchy_cte"."id" = "organization_managerial_summary_cte"."organization_id") WITH NO DATA;--> statement-breakpoint
CREATE MATERIALIZED VIEW "member_view" AS (with "member_cte" as (with "member_status_cte" as (with "training_serial_cte" as (select "id", 
        (extract(year from "date_start")::text ||
        lpad(row_number() over (
          partition by "organizer_id", extract(year from "date_start")
          order by "date_start" asc, "id" asc
        )::text, 3, '0'))
       as "serial" from "training") select "member"."id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "training"."id",
              'name', "training"."name",
              'type', "training"."type",
              'dateStart', "training"."date_start",
              'dateEnd', "training"."date_end",
              'serial', "training_serial_cte"."serial",
              'isPassing', "training_attendants"."is_passing"
            )
          ) filter (where "training"."id" is not null),
          '[]'::json
        )
       as "trainings", 
        case
          max(
            case
              when "training"."type" = 'dm3' and "training_attendants"."is_passing" = true then 3
              when "training"."type" = 'dm2' and "training_attendants"."is_passing" = true then 2
              when "training"."type" = 'dm1' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 3 then 'ab3'
            when 2 then 'ab2'
            when 1 then 'ab1'
            else null
        end
       as "status", 
        case
          max(
            case
              when "training"."type" = 'dpmk' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_mentor", 
        case
          max(
            case
              when "training"."type" = 'tfi' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_instructor" from "member" left join "training_attendants" on "member"."id" = "training_attendants"."attendant_id" left join "training" on "training_attendants"."training_id" = "training"."id" left join "training_serial_cte" on "training"."id" = "training_serial_cte"."id" group by "member"."id"), "member_education_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'institutionId', "institution_id",
              'institutionName', "institution_name",
              'major', "major",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "educations" from "member_education" group by "member_education"."member_id"), "member_career_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'employerId', "employer_id",
              'employerName', "employer_name",
              'position', "position",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "careers" from "member_career" group by "member_career"."member_id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "member"."id", "member"."id_number", "member"."name", "member"."birth_place", "member"."birth_date", "member"."phone", "member"."photo", "member"."gender", "member"."address_province", "member"."address_province_code", "member"."address_city", "member"."address_city_code", "member"."address_district", "member"."address_district_code", "member"."address_subdistrict", "member"."address_subdistrict_code", "member"."address_line", "member"."address_full", "member"."is_an_alumn", "member"."is_suspended", "member_status_cte"."trainings", "member_status_cte"."status", "member_education_cte"."educations", "member_career_cte"."careers", "member_status_cte"."is_certified_mentor", "member_status_cte"."is_certified_instructor", 
          json_build_object(
            'id', "organization_with_hierarchy_cte"."id",
            'name', "organization_with_hierarchy_cte"."name",
            'slug', "organization_with_hierarchy_cte"."slug",
            'code', "organization_with_hierarchy_cte"."code",
            'codeSlug', "organization_with_hierarchy_cte"."code_slug",
            'type', "organization_with_hierarchy_cte"."type",
            'level', "organization_with_hierarchy_cte"."level",
            'logo', "organization_with_hierarchy_cte"."logo",
            'isActive', "organization_with_hierarchy_cte"."is_active",
            'pd', "organization_with_hierarchy_cte"."pd",
            'pdln', "organization_with_hierarchy_cte"."pdln",
            'pw', "organization_with_hierarchy_cte"."pw"
          )
         as "registered_at", "organization_with_hierarchy_cte"."scope_id" from "member" left join "member_status_cte" on "member"."id" = "member_status_cte"."id" left join "member_education_cte" on "member"."id" = "member_education_cte"."member_id" left join "member_career_cte" on "member"."id" = "member_career_cte"."member_id" left join "organization_with_hierarchy_cte" on "member"."registered_at_organization_id" = "organization_with_hierarchy_cte"."id") select "id", "id_number", "name", "birth_place", "birth_date", "phone", "photo", "gender", "address_province", "address_province_code", "address_city", "address_city_code", "address_district", "address_district_code", "address_subdistrict", "address_subdistrict_code", "address_line", "address_full", "is_an_alumn", "is_suspended", "trainings", "status", "educations", "careers", "is_certified_mentor", "is_certified_instructor", "registered_at", "scope_id" from "member_cte") WITH NO DATA;--> statement-breakpoint
CREATE MATERIALIZED VIEW "organization_view" AS (with "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id"), "organization_managerial_summary_cte" as (with "managerial_period_cte" as (with "member_cte" as (with "member_status_cte" as (with "training_serial_cte" as (select "id", 
        (extract(year from "date_start")::text ||
        lpad(row_number() over (
          partition by "organizer_id", extract(year from "date_start")
          order by "date_start" asc, "id" asc
        )::text, 3, '0'))
       as "serial" from "training") select "member"."id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "training"."id",
              'name', "training"."name",
              'type', "training"."type",
              'dateStart', "training"."date_start",
              'dateEnd', "training"."date_end",
              'serial', "training_serial_cte"."serial",
              'isPassing', "training_attendants"."is_passing"
            )
          ) filter (where "training"."id" is not null),
          '[]'::json
        )
       as "trainings", 
        case
          max(
            case
              when "training"."type" = 'dm3' and "training_attendants"."is_passing" = true then 3
              when "training"."type" = 'dm2' and "training_attendants"."is_passing" = true then 2
              when "training"."type" = 'dm1' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 3 then 'ab3'
            when 2 then 'ab2'
            when 1 then 'ab1'
            else null
        end
       as "status", 
        case
          max(
            case
              when "training"."type" = 'dpmk' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_mentor", 
        case
          max(
            case
              when "training"."type" = 'tfi' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_instructor" from "member" left join "training_attendants" on "member"."id" = "training_attendants"."attendant_id" left join "training" on "training_attendants"."training_id" = "training"."id" left join "training_serial_cte" on "training"."id" = "training_serial_cte"."id" group by "member"."id"), "member_education_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'institutionId', "institution_id",
              'institutionName', "institution_name",
              'major', "major",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "educations" from "member_education" group by "member_education"."member_id"), "member_career_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'employerId', "employer_id",
              'employerName', "employer_name",
              'position', "position",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "careers" from "member_career" group by "member_career"."member_id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "member"."id", "member"."id_number", "member"."name", "member"."birth_place", "member"."birth_date", "member"."phone", "member"."photo", "member"."gender", "member"."address_province", "member"."address_province_code", "member"."address_city", "member"."address_city_code", "member"."address_district", "member"."address_district_code", "member"."address_subdistrict", "member"."address_subdistrict_code", "member"."address_line", "member"."address_full", "member"."is_an_alumn", "member"."is_suspended", "member_status_cte"."trainings", "member_status_cte"."status", "member_education_cte"."educations", "member_career_cte"."careers", "member_status_cte"."is_certified_mentor", "member_status_cte"."is_certified_instructor", 
          json_build_object(
            'id', "organization_with_hierarchy_cte"."id",
            'name', "organization_with_hierarchy_cte"."name",
            'slug', "organization_with_hierarchy_cte"."slug",
            'code', "organization_with_hierarchy_cte"."code",
            'codeSlug', "organization_with_hierarchy_cte"."code_slug",
            'type', "organization_with_hierarchy_cte"."type",
            'level', "organization_with_hierarchy_cte"."level",
            'logo', "organization_with_hierarchy_cte"."logo",
            'isActive', "organization_with_hierarchy_cte"."is_active",
            'pd', "organization_with_hierarchy_cte"."pd",
            'pdln', "organization_with_hierarchy_cte"."pdln",
            'pw', "organization_with_hierarchy_cte"."pw"
          )
         as "registered_at", "organization_with_hierarchy_cte"."scope_id" from "member" left join "member_status_cte" on "member"."id" = "member_status_cte"."id" left join "member_education_cte" on "member"."id" = "member_education_cte"."member_id" left join "member_career_cte" on "member"."id" = "member_career_cte"."member_id" left join "organization_with_hierarchy_cte" on "member"."registered_at_organization_id" = "organization_with_hierarchy_cte"."id") select "managerial_period"."id", "managerial_period"."organization_id", "managerial_period"."year_start", "managerial_period"."year_end", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "member_cte"."id",
              'idNo', "member_cte"."id_number",
              'name', "member_cte"."name",
              'phone', "member_cte"."phone",
              'photo', "member_cte"."photo",
              'gender', "member_cte"."gender",
              'status', "member_cte"."status",
              'role', "manager"."role",
              'roleTitle', "manager"."role_title",
              'department', "manager"."department",
              'subDepartment', "manager"."sub_department",
              'isDailyManager', "manager"."isDailyManager"
            )
          ) filter (where "member_cte"."id" is not null),
          '[]'::json
        )
       as "managers" from "managerial_period" left join "manager" on "managerial_period"."id" = "manager"."managerial_period_id" left join "member_cte" on "manager"."manager_id" = "member_cte"."id" group by "managerial_period"."id") select "organization_id", 
          coalesce(
            json_agg(
              json_build_object(
                'id', "id",
                'yearStart', "year_start",
                'yearEnd', "year_end",
                'managers', "managerial_period_cte"."managers"
              )
              order by "year_start" desc
            ),
            '[]'::json
          )
         as "periods" from "managerial_period_cte" group by "managerial_period_cte"."organization_id") select "organization_with_hierarchy_cte"."id", "organization_with_hierarchy_cte"."name", "organization_with_hierarchy_cte"."slug", "organization_with_hierarchy_cte"."code", "organization_with_hierarchy_cte"."code_slug", "organization_with_hierarchy_cte"."type", "organization_with_hierarchy_cte"."level", "organization_with_hierarchy_cte"."logo", "organization_with_hierarchy_cte"."is_active", "organization_with_hierarchy_cte"."children", "organization_with_hierarchy_cte"."child_count", "organization_with_hierarchy_cte"."pd", "organization_with_hierarchy_cte"."pdln", "organization_with_hierarchy_cte"."pw", "organization_with_hierarchy_cte"."scope_id", 
          coalesce(
            "organization_managerial_summary_cte"."periods"->0->'managers',
            '[]'::json
          )
         as "managers" from "organization_with_hierarchy_cte" left join "organization_managerial_summary_cte" on "organization_with_hierarchy_cte"."id" = "organization_managerial_summary_cte"."organization_id") WITH NO DATA;--> statement-breakpoint
CREATE MATERIALIZED VIEW "training_view" AS (with "training_cte" as (with "training_serial_cte" as (select "id", 
        (extract(year from "date_start")::text ||
        lpad(row_number() over (
          partition by "organizer_id", extract(year from "date_start")
          order by "date_start" asc, "id" asc
        )::text, 3, '0'))
       as "serial" from "training"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id"), "training_attendants_cte" as (with "member_cte" as (with "member_status_cte" as (with "training_serial_cte" as (select "id", 
        (extract(year from "date_start")::text ||
        lpad(row_number() over (
          partition by "organizer_id", extract(year from "date_start")
          order by "date_start" asc, "id" asc
        )::text, 3, '0'))
       as "serial" from "training") select "member"."id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "training"."id",
              'name', "training"."name",
              'type', "training"."type",
              'dateStart', "training"."date_start",
              'dateEnd', "training"."date_end",
              'serial', "training_serial_cte"."serial",
              'isPassing', "training_attendants"."is_passing"
            )
          ) filter (where "training"."id" is not null),
          '[]'::json
        )
       as "trainings", 
        case
          max(
            case
              when "training"."type" = 'dm3' and "training_attendants"."is_passing" = true then 3
              when "training"."type" = 'dm2' and "training_attendants"."is_passing" = true then 2
              when "training"."type" = 'dm1' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 3 then 'ab3'
            when 2 then 'ab2'
            when 1 then 'ab1'
            else null
        end
       as "status", 
        case
          max(
            case
              when "training"."type" = 'dpmk' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_mentor", 
        case
          max(
            case
              when "training"."type" = 'tfi' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_instructor" from "member" left join "training_attendants" on "member"."id" = "training_attendants"."attendant_id" left join "training" on "training_attendants"."training_id" = "training"."id" left join "training_serial_cte" on "training"."id" = "training_serial_cte"."id" group by "member"."id"), "member_education_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'institutionId', "institution_id",
              'institutionName', "institution_name",
              'major', "major",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "educations" from "member_education" group by "member_education"."member_id"), "member_career_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'employerId', "employer_id",
              'employerName', "employer_name",
              'position', "position",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "careers" from "member_career" group by "member_career"."member_id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "member"."id", "member"."id_number", "member"."name", "member"."birth_place", "member"."birth_date", "member"."phone", "member"."photo", "member"."gender", "member"."address_province", "member"."address_province_code", "member"."address_city", "member"."address_city_code", "member"."address_district", "member"."address_district_code", "member"."address_subdistrict", "member"."address_subdistrict_code", "member"."address_line", "member"."address_full", "member"."is_an_alumn", "member"."is_suspended", "member_status_cte"."trainings", "member_status_cte"."status", "member_education_cte"."educations", "member_career_cte"."careers", "member_status_cte"."is_certified_mentor", "member_status_cte"."is_certified_instructor", 
          json_build_object(
            'id', "organization_with_hierarchy_cte"."id",
            'name', "organization_with_hierarchy_cte"."name",
            'slug', "organization_with_hierarchy_cte"."slug",
            'code', "organization_with_hierarchy_cte"."code",
            'codeSlug', "organization_with_hierarchy_cte"."code_slug",
            'type', "organization_with_hierarchy_cte"."type",
            'level', "organization_with_hierarchy_cte"."level",
            'logo', "organization_with_hierarchy_cte"."logo",
            'isActive', "organization_with_hierarchy_cte"."is_active",
            'pd', "organization_with_hierarchy_cte"."pd",
            'pdln', "organization_with_hierarchy_cte"."pdln",
            'pw', "organization_with_hierarchy_cte"."pw"
          )
         as "registered_at", "organization_with_hierarchy_cte"."scope_id" from "member" left join "member_status_cte" on "member"."id" = "member_status_cte"."id" left join "member_education_cte" on "member"."id" = "member_education_cte"."member_id" left join "member_career_cte" on "member"."id" = "member_career_cte"."member_id" left join "organization_with_hierarchy_cte" on "member"."registered_at_organization_id" = "organization_with_hierarchy_cte"."id") select "training_attendants"."training_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "member_cte"."id",
              'idNo', "member_cte"."id_number",
              'name', "member_cte"."name",
              'phone', "member_cte"."phone",
              'photo', "member_cte"."photo",
              'gender', "member_cte"."gender",
              'status', "member_cte"."status",
              'registeredAt', "member_cte"."registered_at",
              'isAdmitted', "training_attendants"."is_admitted",
              'isPassing', "training_attendants"."is_passing"
            )  
          ) filter (where "member_cte"."id" is not null),
          '[]'::json
        )
       as "attendants", count("member_cte"."id") as "attendants_count" from "training_attendants" left join "member_cte" on "training_attendants"."attendant_id" = "member_cte"."id" group by "training_attendants"."training_id"), "training_instructors_cte" as (with "member_cte" as (with "member_status_cte" as (with "training_serial_cte" as (select "id", 
        (extract(year from "date_start")::text ||
        lpad(row_number() over (
          partition by "organizer_id", extract(year from "date_start")
          order by "date_start" asc, "id" asc
        )::text, 3, '0'))
       as "serial" from "training") select "member"."id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "training"."id",
              'name', "training"."name",
              'type', "training"."type",
              'dateStart', "training"."date_start",
              'dateEnd', "training"."date_end",
              'serial', "training_serial_cte"."serial",
              'isPassing', "training_attendants"."is_passing"
            )
          ) filter (where "training"."id" is not null),
          '[]'::json
        )
       as "trainings", 
        case
          max(
            case
              when "training"."type" = 'dm3' and "training_attendants"."is_passing" = true then 3
              when "training"."type" = 'dm2' and "training_attendants"."is_passing" = true then 2
              when "training"."type" = 'dm1' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 3 then 'ab3'
            when 2 then 'ab2'
            when 1 then 'ab1'
            else null
        end
       as "status", 
        case
          max(
            case
              when "training"."type" = 'dpmk' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_mentor", 
        case
          max(
            case
              when "training"."type" = 'tfi' and "training_attendants"."is_passing" = true then 1
              else 0
            end
          )
            when 1 then true
            else false
        end
       as "is_certified_instructor" from "member" left join "training_attendants" on "member"."id" = "training_attendants"."attendant_id" left join "training" on "training_attendants"."training_id" = "training"."id" left join "training_serial_cte" on "training"."id" = "training_serial_cte"."id" group by "member"."id"), "member_education_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'institutionId', "institution_id",
              'institutionName', "institution_name",
              'major', "major",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "educations" from "member_education" group by "member_education"."member_id"), "member_career_cte" as (select "member_id", 
        coalesce(
          json_agg(
            json_build_object(
              'type', "type",
              'employerId', "employer_id",
              'employerName', "employer_name",
              'position', "position",
              'yearStart', "year_start",
              'yearEnd', "year_end"
            )
          ) filter (where "member_id" is not null),
          '[]'::json
        )
       as "careers" from "member_career" group by "member_career"."member_id"), "organization_with_hierarchy_cte" as (with "organization_children_cte" as (select "parent_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "id",
              'name', "name",
              'slug', "slug",
              'code', "code",
              'codeSlug', "code_slug",
              'type', "type",
              'level', "level",
              'logo', "logo",
              'isActive', "is_active"
            )
          ) filter (where "id" is not null),
          '[]'::json
        )
       as "children", count("id") as "child_count" from "organization" group by "organization"."parent_id") select "organization"."id", "organization"."name", "organization"."slug", "organization"."code", "organization"."code_slug", "organization"."type", "organization"."level", "organization"."logo", "organization"."is_active", 
          coalesce("organization_children_cte"."children", '[]'::json)
         as "children", 
          coalesce("organization_children_cte"."child_count", 0)
         as "child_count", 
          case
            when "parent"."type" = 'pd' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pd", 
          case
            when "parent"."type" = 'pdln' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            else null
          end
         as "pdln", 
          case
            when "parent"."type" = 'pw' then
              json_build_object(
                'id', "parent"."id",
                'name', "parent"."name",
                'slug', "parent"."slug",
                'code', "parent"."code",
                'codeSlug', "parent"."code_slug",
                'type', "parent"."type",
                'level', "parent"."level",
                'logo', "parent"."logo",
                'isActive', "parent"."is_active"
              )
            when "grandparent"."type" = 'pw' then
              json_build_object(
                'id', "grandparent"."id",
                'name', "grandparent"."name",
                'slug', "grandparent"."slug",
                'code', "grandparent"."code",
                'codeSlug', "grandparent"."code_slug",
                'type', "grandparent"."type",
                'level', "grandparent"."level",
                'logo', "grandparent"."logo",
                'isActive', "grandparent"."is_active"
              )
            else null
          end
         as "pw", 
          array_remove(
            array[
              "organization"."id",
              "parent"."id",
              "grandparent"."id"
            ],
            null
          )
         as "scope_id" from "organization" left join "organization_children_cte" on "organization"."id" = "organization_children_cte"."parent_id" left join "organization" "parent" on "organization"."parent_id" = "parent"."id" left join "organization" "grandparent" on "parent"."parent_id" = "grandparent"."id") select "member"."id", "member"."id_number", "member"."name", "member"."birth_place", "member"."birth_date", "member"."phone", "member"."photo", "member"."gender", "member"."address_province", "member"."address_province_code", "member"."address_city", "member"."address_city_code", "member"."address_district", "member"."address_district_code", "member"."address_subdistrict", "member"."address_subdistrict_code", "member"."address_line", "member"."address_full", "member"."is_an_alumn", "member"."is_suspended", "member_status_cte"."trainings", "member_status_cte"."status", "member_education_cte"."educations", "member_career_cte"."careers", "member_status_cte"."is_certified_mentor", "member_status_cte"."is_certified_instructor", 
          json_build_object(
            'id', "organization_with_hierarchy_cte"."id",
            'name', "organization_with_hierarchy_cte"."name",
            'slug', "organization_with_hierarchy_cte"."slug",
            'code', "organization_with_hierarchy_cte"."code",
            'codeSlug', "organization_with_hierarchy_cte"."code_slug",
            'type', "organization_with_hierarchy_cte"."type",
            'level', "organization_with_hierarchy_cte"."level",
            'logo', "organization_with_hierarchy_cte"."logo",
            'isActive', "organization_with_hierarchy_cte"."is_active",
            'pd', "organization_with_hierarchy_cte"."pd",
            'pdln', "organization_with_hierarchy_cte"."pdln",
            'pw', "organization_with_hierarchy_cte"."pw"
          )
         as "registered_at", "organization_with_hierarchy_cte"."scope_id" from "member" left join "member_status_cte" on "member"."id" = "member_status_cte"."id" left join "member_education_cte" on "member"."id" = "member_education_cte"."member_id" left join "member_career_cte" on "member"."id" = "member_career_cte"."member_id" left join "organization_with_hierarchy_cte" on "member"."registered_at_organization_id" = "organization_with_hierarchy_cte"."id") select "training_instructors"."training_id", 
        coalesce(
          json_agg(
            json_build_object(
              'id', "member_cte"."id",
              'idNo', "member_cte"."id_number",
              'name', "member_cte"."name",
              'phone', "member_cte"."phone",
              'photo', "member_cte"."photo",
              'gender', "member_cte"."gender",
              'status', "member_cte"."status",
              'registeredAt', "member_cte"."registered_at",
              'role', "training_instructors"."role",
              'isIntern', "training_instructors"."is_intern"
            )  
          ) filter (where "member_cte"."id" is not null),
          '[]'::json
        )
       as "instructors", count("member_cte"."id") as "instructors_count" from "training_instructors" left join "member_cte" on "training_instructors"."instructor_id" = "member_cte"."id" group by "training_instructors"."training_id") select "training"."id", "training"."name", "training"."type", "training"."date_start", "training"."date_end", "training"."registration_until", "training"."organizer_id", "training_serial_cte"."serial", 
        coalesce("training_attendants_cte"."attendants", '[]'::json)
       as "attendants", 
        coalesce("training_attendants_cte"."attendants_count", 0)
       as "attendants_count", 
        coalesce("training_instructors_cte"."instructors", '[]'::json)
       as "instructors", 
        coalesce("training_instructors_cte"."instructors_count", 0)
       as "instructors_count", 
          json_build_object(
            'id', "organization_with_hierarchy_cte"."id",
            'name', "organization_with_hierarchy_cte"."name",
            'slug', "organization_with_hierarchy_cte"."slug",
            'code', "organization_with_hierarchy_cte"."code",
            'codeSlug', "organization_with_hierarchy_cte"."code_slug",
            'type', "organization_with_hierarchy_cte"."type",
            'level', "organization_with_hierarchy_cte"."level",
            'isActive', "organization_with_hierarchy_cte"."is_active",
            'logo', "organization_with_hierarchy_cte"."logo",
            'pd', "organization_with_hierarchy_cte"."pd",
            'pdln', "organization_with_hierarchy_cte"."pdln",
            'pw', "organization_with_hierarchy_cte"."pw"
          )
         as "organizer" from "training" left join "training_serial_cte" on "training"."id" = "training_serial_cte"."id" left join "organization_with_hierarchy_cte" on "training"."organizer_id" = "organization_with_hierarchy_cte"."id" left join "training_attendants_cte" on "training"."id" = "training_attendants_cte"."training_id" left join "training_instructors_cte" on "training"."id" = "training_instructors_cte"."training_id") select "id", "name", "type", "date_start", "date_end", "registration_until", "organizer_id", "serial", "attendants", "attendants_count", "instructors", "instructors_count", "organizer" from "training_cte") WITH NO DATA;