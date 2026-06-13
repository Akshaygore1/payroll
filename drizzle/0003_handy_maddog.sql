CREATE TYPE "public"."payroll_row_type" AS ENUM('month', 'extra');--> statement-breakpoint
CREATE TABLE "school_payroll_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"employee_id" text NOT NULL,
	"financial_year" text NOT NULL,
	"row_type" "payroll_row_type" NOT NULL,
	"row_month" integer,
	"row_label" text NOT NULL,
	"display_order" integer NOT NULL,
	"basic_pay" integer DEFAULT 0 NOT NULL,
	"total_pay" integer DEFAULT 0 NOT NULL,
	"da" integer DEFAULT 0 NOT NULL,
	"da_difference_arrears" integer DEFAULT 0 NOT NULL,
	"hra" integer DEFAULT 0 NOT NULL,
	"cla" integer DEFAULT 0 NOT NULL,
	"va_ta_arrear" integer DEFAULT 0 NOT NULL,
	"recovery" integer DEFAULT 0 NOT NULL,
	"gpf" integer DEFAULT 0 NOT NULL,
	"rd" integer DEFAULT 0 NOT NULL,
	"cm_fund" integer DEFAULT 0 NOT NULL,
	"professional_tax" integer DEFAULT 0 NOT NULL,
	"revenue_stamp" integer DEFAULT 0 NOT NULL,
	"income_tax" integer DEFAULT 0 NOT NULL,
	"lic" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" text,
	"updated_by_user_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_payroll_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"school_id" text NOT NULL,
	"statement_start_month" integer DEFAULT 4 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "school_payroll_entry" ADD CONSTRAINT "school_payroll_entry_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_payroll_entry" ADD CONSTRAINT "school_payroll_entry_employee_id_school_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."school_employee"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_payroll_entry" ADD CONSTRAINT "school_payroll_entry_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_payroll_entry" ADD CONSTRAINT "school_payroll_entry_updated_by_user_id_user_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_payroll_settings" ADD CONSTRAINT "school_payroll_settings_school_id_school_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."school"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "school_payroll_entry_school_id_idx" ON "school_payroll_entry" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_payroll_entry_employee_id_idx" ON "school_payroll_entry" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "school_payroll_entry_financial_year_idx" ON "school_payroll_entry" USING btree ("financial_year");--> statement-breakpoint
CREATE UNIQUE INDEX "school_payroll_settings_school_id_unique" ON "school_payroll_settings" USING btree ("school_id");