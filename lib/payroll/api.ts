import {
  calculateDerivedPayrollFields,
  getStatementMonthYear,
  monthNames,
  payrollColumnLabels,
  type PayrollAmountFields,
  type PayrollDerivedFields,
  type PayrollLedgerRowInput,
} from "@/lib/payroll/core";
import { ApiError } from "@/lib/schools/api";

export type PayrollSchoolRecord = {
  id: string;
  schoolName: string;
  principalName: string;
  address: string;
  tanNo: string;
};

export type PayrollEmployeeRecord = {
  id: string;
  fullName: string;
  designation: string;
  panNumber: string;
  gpfNumber: string;
  pfNumber: string;
  npsAccountNumber: string;
  contactNumber: string;
};

export type PayrollSettingsRecord = {
  id: string;
  schoolId: string;
  statementStartMonth: number;
  createdAt: string;
  updatedAt: string;
};

export type PayrollLedgerRowRecord = {
  id: string;
  schoolId: string;
  employeeId: string;
  financialYear: string;
  rowType: "month" | "extra";
  rowMonth: number | null;
  rowLabel: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
} & PayrollAmountFields &
  PayrollDerivedFields;

export type PayrollContextResponse = {
  school: PayrollSchoolRecord;
  settings: PayrollSettingsRecord;
  employees: PayrollEmployeeRecord[];
  financialYears: string[];
};

export type PayrollLedgerResponse = {
  school: PayrollSchoolRecord;
  employee: PayrollEmployeeRecord;
  settings: PayrollSettingsRecord;
  financialYear: string;
  rows: PayrollLedgerRowRecord[];
};

type RequestErrorBody = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string>;
};

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

async function requestJson<TResponse>(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });

  const body = await readJson<TResponse & RequestErrorBody>(response);

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body;
}

function buildPayrollContextUrl(schoolId?: string) {
  const searchParams = new URLSearchParams();

  if (schoolId) {
    searchParams.set("schoolId", schoolId);
  }

  const query = searchParams.toString();
  return `/api/payroll/context${query ? `?${query}` : ""}`;
}

function buildPayrollLedgerUrl(params: {
  schoolId?: string;
  employeeId: string;
  financialYear: string;
}) {
  const searchParams = new URLSearchParams({
    employeeId: params.employeeId,
    financialYear: params.financialYear,
  });

  if (params.schoolId) {
    searchParams.set("schoolId", params.schoolId);
  }

  return `/api/payroll/ledger?${searchParams.toString()}`;
}

export function getPayrollContextQuery(schoolId?: string) {
  return requestJson<PayrollContextResponse>(buildPayrollContextUrl(schoolId));
}

export function getPayrollLedgerQuery(params: {
  schoolId?: string;
  employeeId: string;
  financialYear: string;
}) {
  return requestJson<PayrollLedgerResponse>(buildPayrollLedgerUrl(params));
}

export function updatePayrollSettingsMutation(
  values: { statementStartMonth: number },
  schoolId?: string,
) {
  const searchParams = new URLSearchParams();

  if (schoolId) {
    searchParams.set("schoolId", schoolId);
  }

  const query = searchParams.toString();
  return requestJson<{ settings: PayrollSettingsRecord }>(
    `/api/payroll/settings${query ? `?${query}` : ""}`,
    {
      method: "PUT",
      body: JSON.stringify(values),
    },
  );
}

export function savePayrollLedgerMutation(
  values: {
    employeeId: string;
    financialYear: string;
    rows: PayrollLedgerRowInput[];
  },
  schoolId?: string,
) {
  const searchParams = new URLSearchParams();

  if (schoolId) {
    searchParams.set("schoolId", schoolId);
  }

  const query = searchParams.toString();

  return requestJson<{ rows: PayrollLedgerRowRecord[] }>(
    `/api/payroll/ledger${query ? `?${query}` : ""}`,
    {
      method: "PUT",
      body: JSON.stringify(values),
    },
  );
}

export function normalizeLedgerRow(row: PayrollLedgerRowRecord) {
  const amounts = {
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
  };

  return {
    ...row,
    ...amounts,
    ...calculateDerivedPayrollFields(amounts),
  };
}

export function summarizePayrollRows(rows: PayrollLedgerRowRecord[]) {
  return rows.reduce(
    (totals, row) => {
      const next = { ...totals };

      for (const key of Object.keys(payrollColumnLabels) as Array<
        keyof (PayrollAmountFields & PayrollDerivedFields)
      >) {
        next[key] += row[key];
      }

      return next;
    },
    {
      basicPay: 0,
      totalPay: 0,
      da: 0,
      daDifferenceArrears: 0,
      hra: 0,
      cla: 0,
      vaTaArrear: 0,
      totalEarnings: 0,
      recovery: 0,
      grandTotal: 0,
      gpf: 0,
      rd: 0,
      cmFund: 0,
      professionalTax: 0,
      revenueStamp: 0,
      incomeTax: 0,
      lic: 0,
      totalDeduction: 0,
      netSalary: 0,
    },
  );
}

export function getRowPeriodLabel(
  financialYear: string,
  statementStartMonth: number,
  row: Pick<PayrollLedgerRowRecord, "rowType" | "rowMonth" | "rowLabel">,
) {
  if (row.rowType === "extra" || row.rowMonth === null) {
    return row.rowLabel;
  }

  const monthYear = getStatementMonthYear(
    financialYear,
    statementStartMonth,
    row.rowMonth,
  );

  if (!monthYear) {
    return row.rowLabel;
  }

  return `${monthNames[row.rowMonth - 1]}-${String(monthYear.year).slice(-2)}`;
}
