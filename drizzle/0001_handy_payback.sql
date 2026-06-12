ALTER TYPE "public"."user_role" ADD VALUE 'school';--> statement-breakpoint
CREATE TABLE "school" (
	"id" text PRIMARY KEY NOT NULL,
	"school_name" text NOT NULL,
	"principal_name" text NOT NULL,
	"address" text NOT NULL,
	"tan_no" text NOT NULL,
	"user_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN "impersonated_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp;--> statement-breakpoint
ALTER TABLE "school" ADD CONSTRAINT "school_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "school_tan_no_unique" ON "school" USING btree ("tan_no");--> statement-breakpoint
CREATE UNIQUE INDEX "school_user_id_unique" ON "school" USING btree ("user_id");