import ExcelJS from "exceljs";

import {
  defaultStatementStartMonth,
  getStatementMonthYear,
  monthNames,
  parseFinancialYearLabel,
} from "@/lib/payroll/core";
import type {
  PayrollContextSchool,
  PayrollEmployeeOption,
  PayrollSettingsRecord,
  SchoolPayrollLedgerExportRow,
} from "@/lib/payroll/data";

const challanColumns = [
  "S. No.",
  "TDS (Rs.)",
  "Surcharge (Rs.)",
  "Education Cess (Rs.)",
  "Higher Education Cess (Rs.)",
  "Interest (Rs.)",
  "Other (Rs.)",
  "Fee (Rs.)",
  "Cheque/DD No.",
  "BSR Code",
  "Date on which Tax Deposited",
  "Transfer Voucher/ Challan No.",
  "Whether TDS deposited by book entry?",
  "Minor Head ",
] as const;

const challanCodeRow = [
  301,
  302,
  303,
  304,
  305,
  306,
  307,
  308,
  309,
  310,
  311,
  312,
  "",
  "",
] as const;

const challanAdjustmentColumns = [
  " Serial No.",
  "Employee reference No. provided by employer",
  " PAN of the employee",
  "Name of Employee",
  "Date of payment / credit ",
  "Period of Employment     To - Date",
  "Taxable amount on which tax deducted Rs.",
  "TDS",
  "Surcharge",
  "Health and Education Cess",
  "Higher Education Cess",
  "Total Tax Deducted (319+320+321) Rs.",
  "Total Tax deposited Rs.",
  "Date of deduction",
  "date of deposit",
  "Transfer Voucher/ Challan Serial No.",
  "BSR Code",
  "Challan Detail [Sr No (BSR, Date, Challan No.)]",
  "Reason for non-deduction/ lower deduction",
  "Lower Certificate No.",
] as const;

const challanAdjustmentCodeRow = [
  313,
  314,
  315,
  316,
  317,
  316,
  318,
  319,
  320,
  321,
  322,
  323,
  324,
  325,
  326,
  "327",
  "BSR Code",
  "328",
  329,
  "",
] as const;

export type ChallanExportSource = {
  school: PayrollContextSchool;
  employees: PayrollEmployeeOption[];
  settings: PayrollSettingsRecord;
  ledgerRows: SchoolPayrollLedgerExportRow[];
  financialYear: string;
};

type StatementMonth = {
  serialNumber: number;
  month: number;
  year: number;
  label: string;
};

function getStatementMonths(
  financialYear: string,
  statementStartMonth: number,
): StatementMonth[] {
  const parsed = parseFinancialYearLabel(financialYear);

  if (!parsed) {
    throw new Error("Use a financial year like 2023-24.");
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = ((statementStartMonth - 1 + index) % 12) + 1;
    const monthYear = getStatementMonthYear(
      financialYear,
      statementStartMonth,
      month,
    );

    return {
      serialNumber: index + 1,
      month,
      year: monthYear?.year ?? parsed.startYear,
      label: `${monthNames[month - 1]}-${String(monthYear?.year ?? parsed.startYear).slice(-2)}`,
    };
  });
}

function buildChallanSheetRows(source: ChallanExportSource) {
  const statementStartMonth =
    source.settings.statementStartMonth || defaultStatementStartMonth;
  const statementMonths = getStatementMonths(
    source.financialYear,
    statementStartMonth,
  );
  const monthlyTax = new Map<number, number>();

  for (const row of source.ledgerRows) {
    if (row.rowType !== "month" || row.rowMonth === null) {
      continue;
    }

    monthlyTax.set(row.rowMonth, (monthlyTax.get(row.rowMonth) ?? 0) + row.incomeTax);
  }

  return statementMonths.map((month) => ({
    statementMonth: month,
    values: [
      month.serialNumber,
      monthlyTax.get(month.month) ?? 0,
      0,
      0,
      0,
      0,
      0,
      0,
      "",
      "",
      "",
      "",
      "No",
      "200",
    ],
  }));
}

function buildChallanAdjustmentRows(source: ChallanExportSource) {
  const statementStartMonth =
    source.settings.statementStartMonth || defaultStatementStartMonth;
  const statementMonths = getStatementMonths(
    source.financialYear,
    statementStartMonth,
  );
  const monthSerialLookup = new Map(
    statementMonths.map((month) => [month.month, month.serialNumber]),
  );

  const monthOrder = new Map(
    statementMonths.map((month, index) => [month.month, index]),
  );

  return source.ledgerRows
    .filter((row) => row.rowType === "month" && row.rowMonth !== null)
    .toSorted((left, right) => {
      const monthDelta =
        (monthOrder.get(left.rowMonth ?? 0) ?? Number.MAX_SAFE_INTEGER) -
        (monthOrder.get(right.rowMonth ?? 0) ?? Number.MAX_SAFE_INTEGER);

      if (monthDelta !== 0) {
        return monthDelta;
      }

      const nameDelta = left.employeeName.localeCompare(right.employeeName);

      if (nameDelta !== 0) {
        return nameDelta;
      }

      return left.displayOrder - right.displayOrder;
    })
    .map((row, index) => {
      const tds = row.incomeTax;
      return [
        index + 1,
        "",
        row.employeePanNumber,
        row.employeeName,
        "",
        "",
        row.grandTotal,
        tds,
        0,
        0,
        0,
        tds,
        tds,
        "",
        "",
        "",
        "",
        monthSerialLookup.get(row.rowMonth ?? 0) ?? "",
        "",
        "",
      ];
    });
}

function applyGridBorders(row: ExcelJS.Row, totalColumns: number) {
  for (let column = 1; column <= totalColumns; column += 1) {
    row.getCell(column).border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    row.getCell(column).alignment = {
      vertical: "middle",
      horizontal: column <= 2 ? "left" : "center",
      wrapText: true,
    };
  }
}

function buildChallanWorksheet(
  workbook: ExcelJS.Workbook,
  source: ChallanExportSource,
) {
  const worksheet = workbook.addWorksheet("Challan");

  worksheet.columns = [
    { width: 10 },
    { width: 14 },
    { width: 14 },
    { width: 18 },
    { width: 24 },
    { width: 14 },
    { width: 12 },
    { width: 10 },
    { width: 16 },
    { width: 14 },
    { width: 20 },
    { width: 24 },
    { width: 32 },
    { width: 12 },
  ];

  worksheet.addRow(["TAN:", source.school.tanNo]);
  worksheet.addRow([
    "      Details of tax deducted and paid to the credit of the Central Government",
  ]);
  worksheet.addRow([...challanColumns]);
  worksheet.addRow([...challanCodeRow]);

  for (const row of buildChallanSheetRows(source)) {
    worksheet.addRow(row.values);
  }

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(2).font = { bold: true };
  worksheet.getRow(3).font = { bold: true };
  worksheet.getRow(4).font = { italic: true };

  for (let rowIndex = 3; rowIndex <= 16; rowIndex += 1) {
    applyGridBorders(worksheet.getRow(rowIndex), challanColumns.length);
  }

  worksheet.getColumn(2).numFmt = "0";
}

function buildChallanAdjustmentWorksheet(
  workbook: ExcelJS.Workbook,
  source: ChallanExportSource,
) {
  const worksheet = workbook.addWorksheet("Challan_adjustment");

  worksheet.columns = [
    { width: 12 },
    { width: 28 },
    { width: 18 },
    { width: 28 },
    { width: 29.43 },
    { width: 22 },
    { width: 31.43 },
    { width: 12 },
    { width: 12 },
    { width: 22 },
    { width: 22 },
    { width: 28 },
    { width: 22 },
    { width: 18 },
    { width: 18 },
    { width: 26 },
    { width: 14 },
    { width: 28 },
    { width: 28 },
    { width: 20 },
  ];

  worksheet.addRow([
    "",
    "",
    "",
    "Please do not Cut/Copy/Paste (it may cause inconsistancy in data).",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "Leave it blank",
    "",
    "",
    "Select Either (date of deposit,Transfer Voucher/ Challan Serial No.,BSR Code) or (Challan S. No.) Must be correspond to Challan Sheet.",
  ]);
  worksheet.addRow([...challanAdjustmentColumns]);
  worksheet.addRow([...challanAdjustmentCodeRow]);

  for (const row of buildChallanAdjustmentRows(source)) {
    worksheet.addRow(row);
  }

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(2).font = { bold: true };
  worksheet.getRow(3).font = { italic: true };

  const lastRow = Math.max(3, worksheet.rowCount);

  for (let rowIndex = 2; rowIndex <= lastRow; rowIndex += 1) {
    applyGridBorders(worksheet.getRow(rowIndex), challanAdjustmentColumns.length);
  }

  worksheet.getColumn(7).numFmt = "0";
  worksheet.getColumn(8).numFmt = "0";
  worksheet.getColumn(12).numFmt = "0";
  worksheet.getColumn(13).numFmt = "0";
}

export async function createChallanWorkbookBuffer(source: ChallanExportSource) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "OpenAI Codex";
  workbook.created = new Date();
  workbook.modified = new Date();

  buildChallanWorksheet(workbook, source);
  buildChallanAdjustmentWorksheet(workbook, source);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function buildChallanFileName(schoolName: string, financialYear: string) {
  const sanitizedSchoolName = schoolName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${sanitizedSchoolName || "school"}-${financialYear}-challans.xlsx`;
}
