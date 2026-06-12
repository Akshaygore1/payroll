CREATE TABLE "school_employee" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"full_name" text NOT NULL,
	"designation" text NOT NULL,
	"pan_number" text NOT NULL,
	"gpf_number" text NOT NULL,
	"pf_number" text NOT NULL,
	"nps_account_number" text NOT NULL,
	"whatsapp_number" text NOT NULL,
	"contact_number" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_employee" ADD CONSTRAINT "school_employee_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_employee_school_id_idx" ON "school_employee" USING btree ("school_id");