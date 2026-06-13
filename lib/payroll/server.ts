import { z } from "zod";

import { getSession } from "@/lib/auth/session";
import type { PayrollLedgerRowInput } from "@/lib/payroll/core";
import {
  buildDefaultPayrollRows,
  calculateDerivedPayrollFields,
  defaultStatementStartMonth,
  getFinancialYearOptions,
  parseFinancialYearLabel,
  payrollAmountFieldKeys,
} from "@/lib/payroll/core";
import {
  getPayrollEmployeeById,
  getPayrollSchoolById,
  getPayrollSettings,
  listPayrollEmployees,
  listPayrollLedger,
  savePayrollLedger,
  upsertPayrollSettings,
} from "@/lib/payroll/data";
import { getSchoolIdForUser } from "@/lib/schools/employees";
import { getErrorMessage, jsonResponse } from "@/lib/schools/server";

const payrollAmountShape = Object.fromEntries(
  payrollAmountFieldKeys.map((key) => [key, z.number().int().min(0)]),
) as Record<(typeof payrollAmountFieldKeys)[number], z.ZodNumber>;

export const payrollSettingsSchema = z.object({
  statementStartMonth: z.number().int().min(1).max(12),
});

const payrollLedgerRowSchema = z
  .object({
    id: z.string().min(1).optional(),
    rowType: z.enum(["month", "extra"]),
    rowMonth: z.number().int().min(1).max(12).nullable(),
    rowLabel: z.string().trim().min(1, "Row label is required."),
    displayOrder: z.number().int().min(0),
    ...payrollAmountShape,
  })
  .superRefine((value, context) => {
    if (value.rowType === "month" && value.rowMonth === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Month rows must include a month.",
        path: ["rowMonth"],
      });
    }

    if (value.rowType === "extra" && value.rowMonth !== null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Extra rows cannot include a month.",
        path: ["rowMonth"],
      });
    }
  });

export const payrollLedgerPayloadSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee is required."),
  financialYear: z
    .string()
    .trim()
    .refine((value) => parseFinancialYearLabel(value) !== null, {
      message: "Use a financial year like 2023-24.",
    }),
  rows: z.array(payrollLedgerRowSchema).min(1, "At least one row is required."),
});

function serializeDates<T extends { createdAt: Date; updatedAt: Date }>(record: T) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function getFieldErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;

  return Object.fromEntries(
    Object.entries(flattened).map(([key, value]) => [
      key,
      value?.[0] ?? "Invalid value.",
    ]),
  );
}

export async function requirePayrollAccess(requestedSchoolId: string | null) {
  const session = await getSession();

  if (!session) {
    return {
      response: jsonResponse({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role === "school") {
    const schoolId = await getSchoolIdForUser(session.user.id);

    if (!schoolId) {
      return {
        response: jsonResponse({ error: "School not found." }, { status: 404 }),
      };
    }

    if (requestedSchoolId && requestedSchoolId !== schoolId) {
      return {
        response: jsonResponse({ error: "Forbidden" }, { status: 403 }),
      };
    }

    return { session, schoolId };
  }

  if (session.user.role === "admin") {
    if (!requestedSchoolId) {
      return {
        response: jsonResponse(
          { error: "School selection is required." },
          { status: 400 },
        ),
      };
    }

    return { session, schoolId: requestedSchoolId };
  }

  return {
    response: jsonResponse({ error: "Forbidden" }, { status: 403 }),
  };
}

export async function getPayrollContext(requestedSchoolId: string | null) {
  const access = await requirePayrollAccess(requestedSchoolId);

  if ("response" in access) {
    return access.response;
  }

  const [schoolRecord, settingsRecord, employees] = await Promise.all([
    getPayrollSchoolById(access.schoolId),
    getPayrollSettings(access.schoolId),
    listPayrollEmployees(access.schoolId),
  ]);

  if (!schoolRecord) {
    return jsonResponse({ error: "School not found." }, { status: 404 });
  }

  return jsonResponse(
    {
      school: schoolRecord,
      settings: serializeDates(settingsRecord),
      employees,
      financialYears: getFinancialYearOptions(),
    },
    { status: 200 },
  );
}

export async function updatePayrollSettings(
  requestedSchoolId: string | null,
  body: unknown,
) {
  const access = await requirePayrollAccess(requestedSchoolId);

  if ("response" in access) {
    return access.response;
  }

  const parsed = payrollSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      {
        status: "error",
        message: "Fix the highlighted fields.",
        fieldErrors: getFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  try {
    const schoolRecord = await getPayrollSchoolById(access.schoolId);

    if (!schoolRecord) {
      return jsonResponse({ error: "School not found." }, { status: 404 });
    }

    const settings = await upsertPayrollSettings(
      access.schoolId,
      parsed.data.statementStartMonth,
    );

    return jsonResponse(
      {
        status: "success",
        message: "Payroll settings updated.",
        settings: serializeDates(settings),
      },
      { status: 200 },
    );
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        message: getErrorMessage(error, "Unable to update payroll settings."),
      },
      { status: 500 },
    );
  }
}

function buildLedgerResponse(
  rows: PayrollLedgerRowInput[],
  employeeId: string,
  financialYear: string,
  schoolId: string,
) {
  const now = new Date().toISOString();

  return rows.map((row, index) => ({
    id: row.id ?? "",
    schoolId,
    employeeId,
    financialYear,
    ...row,
    rowType: row.rowType,
    rowMonth: row.rowMonth,
    rowLabel: row.rowLabel,
    displayOrder: index,
    ...calculateDerivedPayrollFields(row),
    createdAt: now,
    updatedAt: now,
  }));
}

export async function getPayrollLedger(
  requestedSchoolId: string | null,
  employeeId: string | null,
  financialYear: string | null,
) {
  const access = await requirePayrollAccess(requestedSchoolId);

  if ("response" in access) {
    return access.response;
  }

  if (!employeeId || !financialYear) {
    return jsonResponse(
      { error: "Employee and financial year are required." },
      { status: 400 },
    );
  }

  if (!parseFinancialYearLabel(financialYear)) {
    return jsonResponse(
      { error: "Use a financial year like 2023-24." },
      { status: 400 },
    );
  }

  const [schoolRecord, settings, employee] = await Promise.all([
    getPayrollSchoolById(access.schoolId),
    getPayrollSettings(access.schoolId),
    getPayrollEmployeeById(access.schoolId, employeeId),
  ]);

  if (!schoolRecord) {
    return jsonResponse({ error: "School not found." }, { status: 404 });
  }

  if (!employee) {
    return jsonResponse({ error: "Employee not found." }, { status: 404 });
  }

  const rows = await listPayrollLedger(access.schoolId, employeeId, financialYear);
  const ledgerRows =
    rows.length > 0
      ? rows
      : buildLedgerResponse(
          buildDefaultPayrollRows(
            financialYear,
            settings.statementStartMonth || defaultStatementStartMonth,
          ),
          employeeId,
          financialYear,
          access.schoolId,
        );

  return jsonResponse(
    {
      school: schoolRecord,
      employee,
      settings: serializeDates(settings),
      financialYear,
      rows: ledgerRows,
    },
    { status: 200 },
  );
}

export async function savePayrollLedgerForSchool(
  requestedSchoolId: string | null,
  body: unknown,
) {
  const access = await requirePayrollAccess(requestedSchoolId);

  if ("response" in access) {
    return access.response;
  }

  const parsed = payrollLedgerPayloadSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(
      {
        status: "error",
        message: "Fix the highlighted fields.",
        fieldErrors: getFieldErrors(parsed.error),
      },
      { status: 400 },
    );
  }

  const employee = await getPayrollEmployeeById(
    access.schoolId,
    parsed.data.employeeId,
  );

  if (!employee) {
    return jsonResponse({ error: "Employee not found." }, { status: 404 });
  }

  try {
    const rows = parsed.data.rows.map((row, index) => ({
      ...row,
      displayOrder: index,
    }));

    const savedRows = await savePayrollLedger(
      access.schoolId,
      parsed.data.employeeId,
      parsed.data.financialYear,
      rows,
      access.session.user.id,
    );

    return jsonResponse(
      {
        status: "success",
        message: "Payroll saved.",
        rows: savedRows,
      },
      { status: 200 },
    );
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        message: getErrorMessage(error, "Unable to save payroll."),
      },
      { status: 500 },
    );
  }
}
