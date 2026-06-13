export const payrollAmountFieldKeys = [
  "basicPay",
  "totalPay",
  "da",
  "daDifferenceArrears",
  "hra",
  "cla",
  "vaTaArrear",
  "recovery",
  "gpf",
  "rd",
  "cmFund",
  "professionalTax",
  "revenueStamp",
  "incomeTax",
  "lic",
] as const;

export const earningFieldKeys = [
  "totalPay",
  "da",
  "daDifferenceArrears",
  "hra",
  "cla",
  "vaTaArrear",
] as const;

export const deductionFieldKeys = [
  "gpf",
  "rd",
  "cmFund",
  "professionalTax",
  "revenueStamp",
  "incomeTax",
  "lic",
] as const;

export const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type PayrollRowType = "month" | "extra";

export type PayrollAmountFields = Record<
  (typeof payrollAmountFieldKeys)[number],
  number
>;

export type PayrollDerivedFields = {
  totalEarnings: number
  grandTotal: number
  totalDeduction: number
  netSalary: number
}

export type PayrollLedgerRow = {
  id: string;
  schoolId: string;
  employeeId: string;
  financialYear: string;
  rowType: PayrollRowType;
  rowMonth: number | null;
  rowLabel: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
} & PayrollAmountFields &
  PayrollDerivedFields;

export type PayrollLedgerRowInput = {
  id?: string;
  rowType: PayrollRowType;
  rowMonth: number | null;
  rowLabel: string;
  displayOrder: number;
} & PayrollAmountFields;

export const payrollColumnLabels: Record<
  keyof PayrollAmountFields | keyof PayrollDerivedFields,
  string
> = {
  basicPay: "Basic Pay",
  totalPay: "Total (Pay)",
  da: "D.A.",
  daDifferenceArrears: "D.A. Difference / Arrears",
  hra: "HRA",
  cla: "C.L.A.",
  vaTaArrear: "V.A./T.A. Arrear",
  totalEarnings: "Total Earnings",
  recovery: "Recovery",
  grandTotal: "Grand Total",
  gpf: "G.P.F.",
  rd: "R.D.",
  cmFund: "C.M. Fund",
  professionalTax: "Professional Tax",
  revenueStamp: "Revenue Stamp",
  incomeTax: "Income Tax",
  lic: "L.I.C.",
  totalDeduction: "Total Deduction",
  netSalary: "Net Salary",
};

export const defaultStatementStartMonth = 4;

export function createEmptyPayrollAmountFields(): PayrollAmountFields {
  return {
    basicPay: 0,
    totalPay: 0,
    da: 0,
    daDifferenceArrears: 0,
    hra: 0,
    cla: 0,
    vaTaArrear: 0,
    recovery: 0,
    gpf: 0,
    rd: 0,
    cmFund: 0,
    professionalTax: 0,
    revenueStamp: 0,
    incomeTax: 0,
    lic: 0,
  };
}

export function calculateDerivedPayrollFields(
  amounts: PayrollAmountFields,
): PayrollDerivedFields {
  const totalEarnings = earningFieldKeys.reduce(
    (sum, key) => sum + amounts[key],
    0,
  );
  const totalDeduction = deductionFieldKeys.reduce(
    (sum, key) => sum + amounts[key],
    0,
  );
  const grandTotal = totalEarnings - amounts.recovery;
  const netSalary = grandTotal - totalDeduction;

  return {
    totalEarnings,
    grandTotal,
    totalDeduction,
    netSalary,
  };
}

function formatFinancialYearLabel(startYear: number) {
  const endYear = startYear + 1;
  return `${startYear}-${String(endYear).slice(-2)}`;
}

export function parseFinancialYearLabel(financialYear: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(financialYear.trim());

  if (!match) {
    return null;
  }

  const startYear = Number(match[1]);
  const endYear = Number(`20${match[2]}`);

  if (endYear !== startYear + 1) {
    return null;
  }

  return { startYear, endYear };
}

export function getFinancialYearOptions(now = new Date(), count = 8) {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const currentStartYear = month >= defaultStatementStartMonth ? year : year - 1;

  return Array.from({ length: count }, (_, index) =>
    formatFinancialYearLabel(currentStartYear - index),
  );
}

function getStatementMonths(statementStartMonth: number) {
  return Array.from({ length: 12 }, (_, index) => {
    const month = ((statementStartMonth - 1 + index) % 12) + 1;
    return month;
  });
}

export function getStatementMonthYear(
  financialYear: string,
  statementStartMonth: number,
  month: number,
) {
  const parsed = parseFinancialYearLabel(financialYear);

  if (!parsed) {
    return null;
  }

  return {
    year: month >= statementStartMonth ? parsed.startYear : parsed.endYear,
    month,
  };
}

export function buildDefaultPayrollRows(
  financialYear: string,
  statementStartMonth: number,
): PayrollLedgerRowInput[] {
  return getStatementMonths(statementStartMonth).map((month, index) => {
    const monthYear = getStatementMonthYear(
      financialYear,
      statementStartMonth,
      month,
    );
    const label = `${monthNames[month - 1]}-${String(monthYear?.year ?? "").slice(-2)}`;

    return {
      ...createEmptyPayrollAmountFields(),
      rowType: "month",
      rowMonth: month,
      rowLabel: label,
      displayOrder: index,
    };
  });
}

export function sortPayrollRows<T extends { displayOrder: number }>(rows: T[]) {
  return rows.toSorted((left, right) => left.displayOrder - right.displayOrder);
}
