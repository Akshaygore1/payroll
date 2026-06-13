import { and, asc, eq, inArray } from "drizzle-orm";

import { getDb } from "@/lib/db";
import {
  school,
  schoolEmployee,
  schoolPayrollEntry,
  schoolPayrollSettings,
} from "@/lib/db/schema";
import {
  calculateDerivedPayrollFields,
  createEmptyPayrollAmountFields,
  defaultStatementStartMonth,
  sortPayrollRows,
  type PayrollLedgerRow,
  type PayrollLedgerRowInput,
} from "@/lib/payroll/core";

export type PayrollSettingsRecord = {
  id: string;
  schoolId: string;
  statementStartMonth: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PayrollContextSchool = {
  id: string;
  schoolName: string;
  principalName: string;
  address: string;
  tanNo: string;
};

export type PayrollEmployeeOption = {
  id: string;
  fullName: string;
  designation: string;
  panNumber: string;
  gpfNumber: string;
  pfNumber: string;
  npsAccountNumber: string;
  contactNumber: string;
};

type PayrollRowRecord = {
  id: string;
  schoolId: string;
  employeeId: string;
  financialYear: string;
  rowType: "month" | "extra";
  rowMonth: number | null;
  rowLabel: string;
  displayOrder: number;
  basicPay: number;
  totalPay: number;
  da: number;
  daDifferenceArrears: number;
  hra: number;
  cla: number;
  vaTaArrear: number;
  recovery: number;
  gpf: number;
  rd: number;
  cmFund: number;
  professionalTax: number;
  revenueStamp: number;
  incomeTax: number;
  lic: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function getPayrollSchoolById(schoolId: string) {
  const db = getDb();
  const [record] = await db
    .select({
      id: school.id,
      schoolName: school.schoolName,
      principalName: school.principalName,
      address: school.address,
      tanNo: school.tanNo,
    })
    .from(school)
    .where(eq(school.id, schoolId))
    .limit(1);

  return (record ?? null) satisfies PayrollContextSchool | null;
}

export async function listPayrollEmployees(schoolId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: schoolEmployee.id,
      fullName: schoolEmployee.fullName,
      designation: schoolEmployee.designation,
      panNumber: schoolEmployee.panNumber,
      gpfNumber: schoolEmployee.gpfNumber,
      pfNumber: schoolEmployee.pfNumber,
      npsAccountNumber: schoolEmployee.npsAccountNumber,
      contactNumber: schoolEmployee.contactNumber,
    })
    .from(schoolEmployee)
    .where(eq(schoolEmployee.schoolId, schoolId))
    .orderBy(asc(schoolEmployee.fullName));

  return rows satisfies PayrollEmployeeOption[];
}

export async function getPayrollEmployeeById(schoolId: string, employeeId: string) {
  const db = getDb();
  const [record] = await db
    .select({
      id: schoolEmployee.id,
      fullName: schoolEmployee.fullName,
      designation: schoolEmployee.designation,
      panNumber: schoolEmployee.panNumber,
      gpfNumber: schoolEmployee.gpfNumber,
      pfNumber: schoolEmployee.pfNumber,
      npsAccountNumber: schoolEmployee.npsAccountNumber,
      contactNumber: schoolEmployee.contactNumber,
    })
    .from(schoolEmployee)
    .where(
      and(
        eq(schoolEmployee.schoolId, schoolId),
        eq(schoolEmployee.id, employeeId),
      ),
    )
    .limit(1);

  return (record ?? null) satisfies PayrollEmployeeOption | null;
}

export async function getPayrollSettings(schoolId: string) {
  const db = getDb();
  const [record] = await db
    .select({
      id: schoolPayrollSettings.id,
      schoolId: schoolPayrollSettings.schoolId,
      statementStartMonth: schoolPayrollSettings.statementStartMonth,
      createdAt: schoolPayrollSettings.createdAt,
      updatedAt: schoolPayrollSettings.updatedAt,
    })
    .from(schoolPayrollSettings)
    .where(eq(schoolPayrollSettings.schoolId, schoolId))
    .limit(1);

  return (
    record ?? {
      id: "",
      schoolId,
      statementStartMonth: defaultStatementStartMonth,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }
  ) satisfies PayrollSettingsRecord;
}

export async function upsertPayrollSettings(
  schoolId: string,
  statementStartMonth: number,
) {
  const db = getDb();
  const existing = await getPayrollSettings(schoolId);

  if (existing.id) {
    const [updatedRecord] = await db
      .update(schoolPayrollSettings)
      .set({
        statementStartMonth,
        updatedAt: new Date(),
      })
      .where(eq(schoolPayrollSettings.schoolId, schoolId))
      .returning({
        id: schoolPayrollSettings.id,
        schoolId: schoolPayrollSettings.schoolId,
        statementStartMonth: schoolPayrollSettings.statementStartMonth,
        createdAt: schoolPayrollSettings.createdAt,
        updatedAt: schoolPayrollSettings.updatedAt,
      });

    return updatedRecord satisfies PayrollSettingsRecord;
  }

  const [createdRecord] = await db
    .insert(schoolPayrollSettings)
    .values({
      id: crypto.randomUUID(),
      schoolId,
      statementStartMonth,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: schoolPayrollSettings.id,
      schoolId: schoolPayrollSettings.schoolId,
      statementStartMonth: schoolPayrollSettings.statementStartMonth,
      createdAt: schoolPayrollSettings.createdAt,
      updatedAt: schoolPayrollSettings.updatedAt,
    });

  return createdRecord satisfies PayrollSettingsRecord;
}

function mapPayrollRow(record: PayrollRowRecord): PayrollLedgerRow {
  const amounts = {
    basicPay: record.basicPay,
    totalPay: record.totalPay,
    da: record.da,
    daDifferenceArrears: record.daDifferenceArrears,
    hra: record.hra,
    cla: record.cla,
    vaTaArrear: record.vaTaArrear,
    recovery: record.recovery,
    gpf: record.gpf,
    rd: record.rd,
    cmFund: record.cmFund,
    professionalTax: record.professionalTax,
    revenueStamp: record.revenueStamp,
    incomeTax: record.incomeTax,
    lic: record.lic,
  };

  return {
    ...record,
    ...amounts,
    ...calculateDerivedPayrollFields(amounts),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function listPayrollLedger(
  schoolId: string,
  employeeId: string,
  financialYear: string,
) {
  const db = getDb();
  const rows = await db
    .select({
      id: schoolPayrollEntry.id,
      schoolId: schoolPayrollEntry.schoolId,
      employeeId: schoolPayrollEntry.employeeId,
      financialYear: schoolPayrollEntry.financialYear,
      rowType: schoolPayrollEntry.rowType,
      rowMonth: schoolPayrollEntry.rowMonth,
      rowLabel: schoolPayrollEntry.rowLabel,
      displayOrder: schoolPayrollEntry.displayOrder,
      basicPay: schoolPayrollEntry.basicPay,
      totalPay: schoolPayrollEntry.totalPay,
      da: schoolPayrollEntry.da,
      daDifferenceArrears: schoolPayrollEntry.daDifferenceArrears,
      hra: schoolPayrollEntry.hra,
      cla: schoolPayrollEntry.cla,
      vaTaArrear: schoolPayrollEntry.vaTaArrear,
      recovery: schoolPayrollEntry.recovery,
      gpf: schoolPayrollEntry.gpf,
      rd: schoolPayrollEntry.rd,
      cmFund: schoolPayrollEntry.cmFund,
      professionalTax: schoolPayrollEntry.professionalTax,
      revenueStamp: schoolPayrollEntry.revenueStamp,
      incomeTax: schoolPayrollEntry.incomeTax,
      lic: schoolPayrollEntry.lic,
      createdAt: schoolPayrollEntry.createdAt,
      updatedAt: schoolPayrollEntry.updatedAt,
    })
    .from(schoolPayrollEntry)
    .where(
      and(
        eq(schoolPayrollEntry.schoolId, schoolId),
        eq(schoolPayrollEntry.employeeId, employeeId),
        eq(schoolPayrollEntry.financialYear, financialYear),
      ),
    )
    .orderBy(asc(schoolPayrollEntry.displayOrder));

  return rows.map(mapPayrollRow) satisfies PayrollLedgerRow[];
}

export async function savePayrollLedger(
  schoolId: string,
  employeeId: string,
  financialYear: string,
  rows: PayrollLedgerRowInput[],
  actorUserId: string,
) {
  const db = getDb();

  return db.transaction(async (tx) => {
    const existingRows = await tx
      .select({
        id: schoolPayrollEntry.id,
      })
      .from(schoolPayrollEntry)
      .where(
        and(
          eq(schoolPayrollEntry.schoolId, schoolId),
          eq(schoolPayrollEntry.employeeId, employeeId),
          eq(schoolPayrollEntry.financialYear, financialYear),
        ),
      );

    const existingRowIds = new Set(existingRows.map((row) => row.id));
    const submittedIds = rows
      .map((row) => row.id)
      .filter((rowId): rowId is string => Boolean(rowId));
    const deletedIds = existingRows
      .map((row) => row.id)
      .filter((rowId) => !submittedIds.includes(rowId));

    if (deletedIds.length > 0) {
      await tx
        .delete(schoolPayrollEntry)
        .where(inArray(schoolPayrollEntry.id, deletedIds));
    }

    for (const row of rows) {
      const baseValues = {
        schoolId,
        employeeId,
        financialYear,
        rowType: row.rowType,
        rowMonth: row.rowMonth,
        rowLabel: row.rowLabel,
        displayOrder: row.displayOrder,
        basicPay: row.basicPay,
        totalPay: row.totalPay,
        da: row.da,
        daDifferenceArrears: row.daDifferenceArrears,
        hra: row.hra,
        cla: row.cla,
        vaTaArrear: row.vaTaArrear,
        recovery: row.recovery,
        gpf: row.gpf,
        rd: row.rd,
        cmFund: row.cmFund,
        professionalTax: row.professionalTax,
        revenueStamp: row.revenueStamp,
        incomeTax: row.incomeTax,
        lic: row.lic,
        updatedByUserId: actorUserId,
        updatedAt: new Date(),
      };

      if (row.id && existingRowIds.has(row.id)) {
        await tx
          .update(schoolPayrollEntry)
          .set(baseValues)
          .where(eq(schoolPayrollEntry.id, row.id));
      } else {
        await tx.insert(schoolPayrollEntry).values({
          id: crypto.randomUUID(),
          ...baseValues,
          createdByUserId: actorUserId,
          createdAt: new Date(),
        });
      }
    }

    const savedRows = await tx
      .select({
        id: schoolPayrollEntry.id,
        schoolId: schoolPayrollEntry.schoolId,
        employeeId: schoolPayrollEntry.employeeId,
        financialYear: schoolPayrollEntry.financialYear,
        rowType: schoolPayrollEntry.rowType,
        rowMonth: schoolPayrollEntry.rowMonth,
        rowLabel: schoolPayrollEntry.rowLabel,
        displayOrder: schoolPayrollEntry.displayOrder,
        basicPay: schoolPayrollEntry.basicPay,
        totalPay: schoolPayrollEntry.totalPay,
        da: schoolPayrollEntry.da,
        daDifferenceArrears: schoolPayrollEntry.daDifferenceArrears,
        hra: schoolPayrollEntry.hra,
        cla: schoolPayrollEntry.cla,
        vaTaArrear: schoolPayrollEntry.vaTaArrear,
        recovery: schoolPayrollEntry.recovery,
        gpf: schoolPayrollEntry.gpf,
        rd: schoolPayrollEntry.rd,
        cmFund: schoolPayrollEntry.cmFund,
        professionalTax: schoolPayrollEntry.professionalTax,
        revenueStamp: schoolPayrollEntry.revenueStamp,
        incomeTax: schoolPayrollEntry.incomeTax,
        lic: schoolPayrollEntry.lic,
        createdAt: schoolPayrollEntry.createdAt,
        updatedAt: schoolPayrollEntry.updatedAt,
      })
      .from(schoolPayrollEntry)
      .where(
        and(
          eq(schoolPayrollEntry.schoolId, schoolId),
          eq(schoolPayrollEntry.employeeId, employeeId),
          eq(schoolPayrollEntry.financialYear, financialYear),
        ),
      )
      .orderBy(asc(schoolPayrollEntry.displayOrder));

    return sortPayrollRows(savedRows.map(mapPayrollRow));
  });
}

export function createPayrollRowDraft(): PayrollLedgerRowInput {
  return {
    ...createEmptyPayrollAmountFields(),
    rowType: "extra",
    rowMonth: null,
    rowLabel: "",
    displayOrder: 0,
  };
}
