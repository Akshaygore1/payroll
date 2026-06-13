import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "user", "school"]);
export const payrollRowType = pgEnum("payroll_row_type", ["month", "extra"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRole("role").notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    impersonatedBy: text("impersonated_by"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const school = pgTable(
  "school",
  {
    id: text("id").primaryKey(),
    schoolName: text("school_name").notNull(),
    principalName: text("principal_name").notNull(),
    address: text("address").notNull(),
    tanNo: text("tan_no").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("school_tan_no_unique").on(table.tanNo),
    uniqueIndex("school_user_id_unique").on(table.userId),
  ],
);

export const schoolEmployee = pgTable(
  "school_employee",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => school.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    designation: text("designation").notNull(),
    panNumber: text("pan_number").notNull(),
    gpfNumber: text("gpf_number").notNull(),
    pfNumber: text("pf_number").notNull(),
    npsAccountNumber: text("nps_account_number").notNull(),
    whatsappNumber: text("whatsapp_number").notNull(),
    contactNumber: text("contact_number").notNull(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [index("school_employee_school_id_idx").on(table.schoolId)],
);

export const schoolPayrollSettings = pgTable(
  "school_payroll_settings",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => school.id, { onDelete: "cascade" }),
    statementStartMonth: integer("statement_start_month").notNull().default(4),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("school_payroll_settings_school_id_unique").on(table.schoolId),
  ],
);

export const schoolPayrollEntry = pgTable(
  "school_payroll_entry",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id")
      .notNull()
      .references(() => school.id, { onDelete: "cascade" }),
    employeeId: text("employee_id")
      .notNull()
      .references(() => schoolEmployee.id, { onDelete: "cascade" }),
    financialYear: text("financial_year").notNull(),
    rowType: payrollRowType("row_type").notNull(),
    rowMonth: integer("row_month"),
    rowLabel: text("row_label").notNull(),
    displayOrder: integer("display_order").notNull(),
    basicPay: integer("basic_pay").notNull().default(0),
    totalPay: integer("total_pay").notNull().default(0),
    da: integer("da").notNull().default(0),
    daDifferenceArrears: integer("da_difference_arrears").notNull().default(0),
    hra: integer("hra").notNull().default(0),
    cla: integer("cla").notNull().default(0),
    vaTaArrear: integer("va_ta_arrear").notNull().default(0),
    recovery: integer("recovery").notNull().default(0),
    gpf: integer("gpf").notNull().default(0),
    rd: integer("rd").notNull().default(0),
    cmFund: integer("cm_fund").notNull().default(0),
    professionalTax: integer("professional_tax").notNull().default(0),
    revenueStamp: integer("revenue_stamp").notNull().default(0),
    incomeTax: integer("income_tax").notNull().default(0),
    lic: integer("lic").notNull().default(0),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedByUserId: text("updated_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("school_payroll_entry_school_id_idx").on(table.schoolId),
    index("school_payroll_entry_employee_id_idx").on(table.employeeId),
    index("school_payroll_entry_financial_year_idx").on(table.financialYear),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  schools: many(school),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const schoolRelations = relations(school, ({ many, one }) => ({
  user: one(user, {
    fields: [school.userId],
    references: [user.id],
  }),
  employees: many(schoolEmployee),
  payrollSettings: many(schoolPayrollSettings),
  payrollEntries: many(schoolPayrollEntry),
}));

export const schoolEmployeeRelations = relations(
  schoolEmployee,
  ({ many, one }) => ({
    school: one(school, {
      fields: [schoolEmployee.schoolId],
      references: [school.id],
    }),
    payrollEntries: many(schoolPayrollEntry),
  }),
);

export const schoolPayrollSettingsRelations = relations(
  schoolPayrollSettings,
  ({ one }) => ({
    school: one(school, {
      fields: [schoolPayrollSettings.schoolId],
      references: [school.id],
    }),
  }),
);

export const schoolPayrollEntryRelations = relations(
  schoolPayrollEntry,
  ({ one }) => ({
    school: one(school, {
      fields: [schoolPayrollEntry.schoolId],
      references: [school.id],
    }),
    employee: one(schoolEmployee, {
      fields: [schoolPayrollEntry.employeeId],
      references: [schoolEmployee.id],
    }),
    createdByUser: one(user, {
      fields: [schoolPayrollEntry.createdByUserId],
      references: [user.id],
      relationName: "payroll_entry_created_by_user",
    }),
    updatedByUser: one(user, {
      fields: [schoolPayrollEntry.updatedByUserId],
      references: [user.id],
      relationName: "payroll_entry_updated_by_user",
    }),
  }),
);
