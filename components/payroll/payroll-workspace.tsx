"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPayrollContextQuery,
  getPayrollLedgerQuery,
  getRowPeriodLabel,
  normalizeLedgerRow,
  savePayrollLedgerMutation,
  summarizePayrollRows,
  updatePayrollSettingsMutation,
  type PayrollLedgerRowRecord,
} from "@/lib/payroll/api";
import {
  deductionFieldKeys,
  earningFieldKeys,
  monthNames,
  payrollAmountFieldKeys,
  payrollColumnLabels,
} from "@/lib/payroll/core";
import { downloadPayrollPdf } from "@/lib/payroll/pdf";
import { listSchoolsQuery } from "@/lib/schools/api";

const statementMonthOptions = monthNames.map((label, index) => ({
  label,
  value: index + 1,
}));

const summaryColumns = [
  "totalEarnings",
  "grandTotal",
  "totalDeduction",
  "netSalary",
] as const;

type PayrollWorkspaceProps = {
  scope: "admin" | "school";
};

type PayrollContextData = Awaited<ReturnType<typeof getPayrollContextQuery>>;
type PayrollSchool = PayrollContextData["school"];
type PayrollEmployee = PayrollContextData["employees"][number];
type PayrollMonthOption = { label: string; value: string };

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function PayrollSelect({
  children,
  disabled,
  onValueChange,
  placeholder,
  value,
}: {
  children: ReactNode;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <Select disabled={disabled} onValueChange={onValueChange} value={value}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
  );
}

function PayrollAmountInput({
  fieldKey,
  row,
  onChange,
}: {
  fieldKey: (typeof payrollAmountFieldKeys)[number];
  row: PayrollLedgerRowRecord;
  onChange: (
    field: (typeof payrollAmountFieldKeys)[number],
    value: string,
  ) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`payroll-${fieldKey}`}>
        {payrollColumnLabels[fieldKey]}
      </FieldLabel>
      <Input
        className="text-right font-mono tabular-nums"
        id={`payroll-${fieldKey}`}
        inputMode="numeric"
        onChange={(event) => onChange(fieldKey, event.target.value)}
        value={String(row[fieldKey])}
      />
    </Field>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border-card px-4 py-3">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-xl font-semibold">{value}</div>
    </div>
  );
}

function AdminSchoolPicker({
  isPending,
  schools,
  selectedSchoolId,
  onSchoolChange,
}: {
  isPending: boolean;
  schools: Awaited<ReturnType<typeof listSchoolsQuery>>["schools"];
  selectedSchoolId: string;
  onSchoolChange: (value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="font-display text-lg font-bold">
              Select School
            </CardTitle>
            <CardDescription>
              Choose a school to manage its payroll records.
            </CardDescription>
          </div>
          <Field className="w-fit shrink-0">
            <PayrollSelect
              disabled={isPending}
              onValueChange={onSchoolChange}
              placeholder="Select a school"
              value={selectedSchoolId}
            >
              {schools.map((school) => (
                <SelectItem key={school.id} value={school.id}>
                  {school.schoolName}
                </SelectItem>
              ))}
            </PayrollSelect>
          </Field>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          {isPending ? "Loading..." : `${schools.length} schools`}
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollSelectionEmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold">
          Payroll
        </CardTitle>
        <CardDescription>
          Select a school above to begin working with payroll records.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function PayrollLoadingState() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-36" />
      <Skeleton className="h-96" />
    </div>
  );
}

function PayrollErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold">
          Unable to Load Payroll
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function PayrollSchoolSummary({
  employeeCount,
  onSaveSettings,
  onStatementMonthChange,
  payrollSchool,
  statementStartMonth,
}: {
  employeeCount: number;
  onSaveSettings: () => void;
  onStatementMonthChange: (value: string) => void;
  payrollSchool: PayrollSchool;
  statementStartMonth: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="font-display text-lg font-bold">
              {payrollSchool.schoolName}
            </CardTitle>
            <CardDescription>
              Annual payroll ledger and statement setup for the selected school.
            </CardDescription>
          </div>
          <div className="flex items-end gap-2">
            <Field className="w-fit shrink-0">
              <FieldLabel>Statement Start Month</FieldLabel>
              <PayrollSelect
                onValueChange={onStatementMonthChange}
                placeholder="Select month"
                value={String(statementStartMonth)}
              >
                {statementMonthOptions.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {month.label}
                  </SelectItem>
                ))}
              </PayrollSelect>
            </Field>
            <Button onClick={onSaveSettings} size="sm" variant="outline">
              Save Settings
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Principal
            </span>
            <div className="mt-0.5 text-sm">{payrollSchool.principalName}</div>
          </div>
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              TAN No.
            </span>
            <div className="mt-0.5 font-mono text-sm">
              {payrollSchool.tanNo}
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Address
            </span>
            <div className="mt-0.5 text-sm">{payrollSchool.address}</div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Employees
            </span>
            <div className="mt-0.5 text-sm">{employeeCount} available</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollNoEmployeesState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold">
          No Employees
        </CardTitle>
        <CardDescription>
          Add employees before creating payroll rows for this school.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function PayrollLedgerContextBar({
  effectiveEmployeeId,
  effectiveFinancialYear,
  employees,
  financialYears,
  onEmployeeChange,
  onFinancialYearChange,
  selectedEmployee,
}: {
  effectiveEmployeeId: string;
  effectiveFinancialYear: string;
  employees: PayrollEmployee[];
  financialYears: string[];
  onEmployeeChange: (value: string) => void;
  onFinancialYearChange: (value: string) => void;
  selectedEmployee: PayrollEmployee | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold mt-2">
          Employee &amp; Period
        </CardTitle>
        <CardDescription>
          Select the employee and financial year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <Field>
            <FieldLabel>Employee</FieldLabel>
            <PayrollSelect
              onValueChange={onEmployeeChange}
              placeholder="Select employee"
              value={effectiveEmployeeId}
            >
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.fullName}
                </SelectItem>
              ))}
            </PayrollSelect>
          </Field>
          <Field>
            <FieldLabel>Financial Year</FieldLabel>
            <PayrollSelect
              onValueChange={onFinancialYearChange}
              placeholder="Select financial year"
              value={effectiveFinancialYear}
            >
              {financialYears.map((financialYear) => (
                <SelectItem key={financialYear} value={financialYear}>
                  {financialYear}
                </SelectItem>
              ))}
            </PayrollSelect>
          </Field>
          <div className="flex flex-col justify-end pb-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Designation
            </span>
            <div className="mt-0.5 text-sm">
              {selectedEmployee?.designation ?? "-"}
            </div>
          </div>
          <div className="flex flex-col justify-end pb-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              PAN Number
            </span>
            <div className="mt-0.5 font-mono text-sm">
              {selectedEmployee?.panNumber ?? "-"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollMonthlySummaryCards({
  rows,
}: {
  rows: PayrollLedgerRowRecord[];
}) {
  const totals = useMemo(() => summarizePayrollRows(rows), [rows]);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {summaryColumns.map((key) => (
        <SummaryCard
          key={key}
          label={payrollColumnLabels[key]}
          value={totals[key]}
        />
      ))}
    </div>
  );
}

function PayrollMonthlyActionsCard({
  activePanel,
  monthOptions,
  onMonthChange,
  onPanelChange,
  selectedMonth,
}: {
  activePanel: "fill" | "download" | null;
  monthOptions: PayrollMonthOption[];
  onMonthChange: (value: string) => void;
  onPanelChange: (panel: "fill" | "download") => void;
  selectedMonth: string;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold mt-2">
          Payroll Actions
        </CardTitle>
        <CardDescription>
          Select a month, then fill entries or download payslips.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field>
          <FieldLabel>Payroll Month</FieldLabel>
          <PayrollSelect
            disabled={!monthOptions.length}
            onValueChange={onMonthChange}
            placeholder="Select month"
            value={selectedMonth}
          >
            {monthOptions.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </PayrollSelect>
        </Field>
        <div className="flex flex-col gap-2">
          <Button
            disabled={!selectedMonth}
            onClick={() => onPanelChange("fill")}
            size="sm"
            variant={activePanel === "fill" ? "default" : "outline"}
            className="w-full"
          >
            Fill Monthly Payroll
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollMonthlyFillPanel({
  isSaving,
  monthOptions,
  onMonthChange,
  onRowChange,
  onSave,
  saveError,
  saveMessage,
  selectedMonth,
  selectedMonthlyRow,
}: {
  isSaving: boolean;
  monthOptions: PayrollMonthOption[];
  onMonthChange: (value: string) => void;
  onRowChange: (
    field: (typeof payrollAmountFieldKeys)[number],
    value: string,
  ) => void;
  onSave: () => void;
  saveError?: string;
  saveMessage: string | null;
  selectedMonth: string;
  selectedMonthlyRow: PayrollLedgerRowRecord | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base font-bold">
          Monthly Payroll Entry
        </CardTitle>
        <CardDescription>
          Select a month, enter earnings and deductions, then save.
        </CardDescription>
        <CardAction>
          <PayrollSelect
            disabled={!monthOptions.length}
            onValueChange={onMonthChange}
            placeholder="Select month"
            value={selectedMonth}
          >
            {monthOptions.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </PayrollSelect>
        </CardAction>
      </CardHeader>

      {selectedMonthlyRow ? (
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4 border border-border-card px-4 py-3 animate-fade-in-up-delay-2">
              <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground border-b pb-1">
                Earnings
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <PayrollAmountInput
                  fieldKey="basicPay"
                  onChange={onRowChange}
                  row={selectedMonthlyRow}
                />
                {earningFieldKeys.map((key) => (
                  <PayrollAmountInput
                    fieldKey={key}
                    key={key}
                    onChange={onRowChange}
                    row={selectedMonthlyRow}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 border border-border-card px-4 py-3 animate-fade-in-up-delay-3">
              <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground border-b pb-1">
                Deductions
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <PayrollAmountInput
                  fieldKey="recovery"
                  onChange={onRowChange}
                  row={selectedMonthlyRow}
                />
                {deductionFieldKeys.map((key) => (
                  <PayrollAmountInput
                    fieldKey={key}
                    key={key}
                    onChange={onRowChange}
                    row={selectedMonthlyRow}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      ) : null}

      <CardFooter className="justify-between">
        <div className="flex items-center gap-3">
          {saveMessage ? (
            <span className="text-sm text-muted-foreground">{saveMessage}</span>
          ) : null}
          {saveError ? (
            <span className="text-sm text-destructive">{saveError}</span>
          ) : null}
        </div>
        <Button
          disabled={isSaving || !selectedMonthlyRow}
          onClick={onSave}
          size="sm"
        >
          {isSaving ? "Saving..." : "Save Month"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function SelectedMonthOverview({
  row,
  monthLabel,
}: {
  row: PayrollLedgerRowRecord;
  monthLabel: string;
}) {
  const stats = [
    { label: "Net Salary", value: row.netSalary },
    { label: "Total Earnings", value: row.totalEarnings },
    { label: "Total Deduction", value: row.totalDeduction },
    { label: "Basic Pay", value: row.basicPay },
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold mt-2">
          {monthLabel}
        </CardTitle>
        <CardDescription>
          Monthly earnings and deductions overview.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="border border-border-card px-3 py-2"
            >
              <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                {stat.label}
              </div>
              <div className="mt-1 font-mono text-lg font-semibold">
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollMonthlyDownloadPanel({
  monthOptions,
  onDownloadAnnual,
  onDownloadMonthly,
  onMonthChange,
  rows,
  selectedMonth,
  selectedMonthLabel,
  selectedMonthlyRow,
}: {
  monthOptions: PayrollMonthOption[];
  onDownloadAnnual: (rows: PayrollLedgerRowRecord[]) => Promise<void>;
  onDownloadMonthly: (
    rows: PayrollLedgerRowRecord[],
    monthLabel: string,
  ) => Promise<void>;
  onMonthChange: (value: string) => void;
  rows: PayrollLedgerRowRecord[];
  selectedMonth: string;
  selectedMonthLabel: string;
  selectedMonthlyRow: PayrollLedgerRowRecord | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-base font-bold">
          Download Payslip
        </CardTitle>
        <CardDescription>
          Download the full annual statement or a single monthly statement.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-6">
          <Field>
            <FieldLabel>Payroll Month</FieldLabel>
            <PayrollSelect
              disabled={!monthOptions.length}
              onValueChange={onMonthChange}
              placeholder="Select month"
              value={selectedMonth}
            >
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value}>
                  {month.label}
                </SelectItem>
              ))}
            </PayrollSelect>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!selectedMonthlyRow}
              onClick={() =>
                selectedMonthlyRow
                  ? onDownloadMonthly([selectedMonthlyRow], selectedMonthLabel)
                  : undefined
              }
              variant="outline"
            >
              Download Monthly
            </Button>
            <Button
              disabled={!rows.length}
              onClick={() => onDownloadAnnual(rows)}
            >
              Download Annual
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function PayrollMonthlyWorkspace({
  initialRows,
  financialYear,
  statementStartMonth,
  isLoading,
  loadError,
  saveError,
  isSaving,
  onSave,
  onDownloadAnnual,
  onDownloadMonthly,
}: {
  initialRows: PayrollLedgerRowRecord[];
  financialYear: string;
  statementStartMonth: number;
  isLoading: boolean;
  loadError?: string;
  saveError?: string;
  isSaving: boolean;
  onSave: (rows: PayrollLedgerRowRecord[]) => void;
  onDownloadAnnual: (rows: PayrollLedgerRowRecord[]) => Promise<void>;
  onDownloadMonthly: (
    rows: PayrollLedgerRowRecord[],
    monthLabel: string,
  ) => Promise<void>;
}) {
  const [rows, setRows] = useState(initialRows);
  const [activePanel, setActivePanel] = useState<"fill" | "download" | null>(
    null,
  );
  const [selectedMonth, setSelectedMonth] = useState("");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const monthlyRows = useMemo(
    () =>
      rows.filter((row) => row.rowType === "month" && row.rowMonth !== null),
    [rows],
  );
  const selectedMonthlyRow = useMemo(
    () =>
      monthlyRows.find((row) => String(row.rowMonth) === selectedMonth) ?? null,
    [monthlyRows, selectedMonth],
  );

  const monthOptions = useMemo<PayrollMonthOption[]>(
    () =>
      monthlyRows.map((row) => ({
        label: getRowPeriodLabel(financialYear, statementStartMonth, row),
        value: String(row.rowMonth),
      })),
    [financialYear, monthlyRows, statementStartMonth],
  );

  function updateRow(
    rowMonth: number,
    field: (typeof payrollAmountFieldKeys)[number],
    value: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.rowType !== "month" || row.rowMonth !== rowMonth) {
          return row;
        }
        const nextRow = {
          ...row,
          [field]: parseInteger(value),
        };
        return normalizeLedgerRow(nextRow);
      }),
    );
    setSaveMessage(null);
  }

  function handleSave() {
    onSave(rows);
    setSaveMessage("Saving...");
    setTimeout(() => setSaveMessage("Saved"), 1000);
    setTimeout(() => setSaveMessage(null), 3000);
  }

  function handlePanelChange(panel: "fill" | "download") {
    setActivePanel((currentPanel) => (currentPanel === panel ? null : panel));
  }

  function handleSelectedRowChange(
    field: (typeof payrollAmountFieldKeys)[number],
    value: string,
  ) {
    if (!selectedMonthlyRow?.rowMonth) {
      return;
    }

    updateRow(selectedMonthlyRow.rowMonth, field, value);
  }

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === selectedMonth)?.label ?? "";

  return (
    <div className="flex flex-col gap-6">
      {/* <PayrollMonthlySummaryCards rows={rows} /> */}

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <PayrollMonthlyActionsCard
          activePanel={activePanel}
          monthOptions={monthOptions}
          onMonthChange={setSelectedMonth}
          onPanelChange={handlePanelChange}
          selectedMonth={selectedMonth}
        />

        {selectedMonthlyRow ? (
          <SelectedMonthOverview
            monthLabel={selectedMonthLabel}
            row={selectedMonthlyRow}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg font-bold mt-2">
                Month Overview
              </CardTitle>
              <CardDescription>
                Select a month from the Payroll Actions panel to view its
                summary.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {loadError ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg font-bold">
              Unable to Load Ledger
            </CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {activePanel === "fill" ? (
        <PayrollMonthlyFillPanel
          isSaving={isSaving}
          monthOptions={monthOptions}
          onMonthChange={setSelectedMonth}
          onRowChange={handleSelectedRowChange}
          onSave={handleSave}
          saveError={saveError}
          saveMessage={saveMessage}
          selectedMonth={selectedMonth}
          selectedMonthlyRow={selectedMonthlyRow}
        />
      ) : null}

      {activePanel === "download" ? (
        <PayrollMonthlyDownloadPanel
          monthOptions={monthOptions}
          onDownloadAnnual={onDownloadAnnual}
          onDownloadMonthly={onDownloadMonthly}
          onMonthChange={setSelectedMonth}
          rows={rows}
          selectedMonth={selectedMonth}
          selectedMonthLabel={selectedMonthLabel}
          selectedMonthlyRow={selectedMonthlyRow}
        />
      ) : null}
    </div>
  );
}

function PayrollWorkspaceAdminSection({
  isSchoolsPending,
  onSchoolChange,
  scope,
  schools,
  selectedSchoolId,
}: {
  isSchoolsPending: boolean;
  onSchoolChange: (value: string) => void;
  scope: PayrollWorkspaceProps["scope"];
  schools: Awaited<ReturnType<typeof listSchoolsQuery>>["schools"];
  selectedSchoolId: string;
}) {
  return (
    <>
      {scope === "admin" ? (
        <div className="animate-fade-in-up">
          <AdminSchoolPicker
            isPending={isSchoolsPending}
            onSchoolChange={onSchoolChange}
            schools={schools}
            selectedSchoolId={selectedSchoolId}
          />
        </div>
      ) : null}

      {scope === "admin" && !selectedSchoolId ? (
        <div className="animate-fade-in-up-delay-1">
          <PayrollSelectionEmptyState />
        </div>
      ) : null}
    </>
  );
}

function PayrollWorkspaceContent({
  effectiveEmployeeId,
  effectiveFinancialYear,
  isLedgerPending,
  ledgerData,
  ledgerEditorKey,
  ledgerError,
  onDownloadAnnual,
  onDownloadMonthly,
  onEmployeeChange,
  onFinancialYearChange,
  onSaveRows,
  onSaveSettings,
  onStatementMonthChange,
  payrollContext,
  saveError,
  selectedEmployee,
  statementStartMonth,
  isSaving,
}: {
  effectiveEmployeeId: string;
  effectiveFinancialYear: string;
  isLedgerPending: boolean;
  ledgerData: Awaited<ReturnType<typeof getPayrollLedgerQuery>> | undefined;
  ledgerEditorKey: string;
  ledgerError?: Error | null;
  onDownloadAnnual: (rows: PayrollLedgerRowRecord[]) => Promise<void>;
  onDownloadMonthly: (
    rows: PayrollLedgerRowRecord[],
    monthLabel: string,
  ) => Promise<void>;
  onEmployeeChange: (value: string) => void;
  onFinancialYearChange: (value: string) => void;
  onSaveRows: (rows: PayrollLedgerRowRecord[]) => void;
  onSaveSettings: () => void;
  onStatementMonthChange: (value: string) => void;
  payrollContext: PayrollContextData;
  saveError?: string;
  selectedEmployee: PayrollEmployee | null;
  statementStartMonth: number;
  isSaving: boolean;
}) {
  return (
    <div className="animate-fade-in-up-delay-1 flex min-w-0 flex-col gap-6">
      <PayrollSchoolSummary
        employeeCount={payrollContext.employees.length}
        onSaveSettings={onSaveSettings}
        onStatementMonthChange={onStatementMonthChange}
        payrollSchool={payrollContext.school}
        statementStartMonth={statementStartMonth}
      />

      {payrollContext.employees.length === 0 ? (
        <div className="animate-fade-in-up-delay-2">
          <PayrollNoEmployeesState />
        </div>
      ) : (
        <div className="animate-fade-in-up-delay-2 flex min-w-0 flex-col gap-6">
          <PayrollLedgerContextBar
            effectiveEmployeeId={effectiveEmployeeId}
            effectiveFinancialYear={effectiveFinancialYear}
            employees={payrollContext.employees}
            financialYears={payrollContext.financialYears}
            onEmployeeChange={onEmployeeChange}
            onFinancialYearChange={onFinancialYearChange}
            selectedEmployee={selectedEmployee}
          />

          <div className="animate-fade-in-up-delay-3">
            <PayrollMonthlyWorkspace
              financialYear={effectiveFinancialYear}
              initialRows={ledgerData?.rows ?? []}
              isLoading={isLedgerPending}
              isSaving={isSaving}
              key={ledgerEditorKey}
              loadError={ledgerError?.message}
              onDownloadAnnual={onDownloadAnnual}
              onDownloadMonthly={onDownloadMonthly}
              onSave={onSaveRows}
              saveError={saveError}
              statementStartMonth={statementStartMonth}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function PayrollWorkspace({ scope }: PayrollWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const selectedSchoolId =
    scope === "admin" ? (searchParams.get("schoolId") ?? "") : undefined;
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");
  const [statementStartMonthDraft, setStatementStartMonthDraft] = useState<{
    schoolId: string;
    value: number;
  } | null>(null);

  const { data: schoolsData, isPending: isSchoolsPending } = useQuery({
    queryKey: ["schools"],
    queryFn: listSchoolsQuery,
    enabled: scope === "admin",
  });

  const {
    data: payrollContext,
    error: payrollContextError,
    isPending: isPayrollContextPending,
  } = useQuery({
    queryKey: ["payroll", "context", selectedSchoolId || "current"],
    queryFn: () => getPayrollContextQuery(selectedSchoolId || undefined),
    enabled: scope === "school" || Boolean(selectedSchoolId),
  });

  const effectiveEmployeeId = useMemo(() => {
    if (!payrollContext) {
      return "";
    }
    return payrollContext.employees.some(
      (employee) => employee.id === selectedEmployeeId,
    )
      ? selectedEmployeeId
      : "";
  }, [payrollContext, selectedEmployeeId]);

  const effectiveFinancialYear = useMemo(() => {
    if (!payrollContext) {
      return "";
    }
    if (
      selectedFinancialYear &&
      payrollContext.financialYears.includes(selectedFinancialYear)
    ) {
      return selectedFinancialYear;
    }
    return payrollContext.financialYears[0] ?? "";
  }, [payrollContext, selectedFinancialYear]);

  const statementStartMonth = payrollContext
    ? statementStartMonthDraft?.schoolId === payrollContext.school.id
      ? statementStartMonthDraft.value
      : payrollContext.settings.statementStartMonth
    : 4;

  const {
    data: ledgerData,
    error: ledgerError,
    isPending: isLedgerPending,
  } = useQuery({
    queryKey: [
      "payroll",
      "ledger",
      selectedSchoolId || "current",
      effectiveEmployeeId,
      effectiveFinancialYear,
    ],
    queryFn: () =>
      getPayrollLedgerQuery({
        schoolId: selectedSchoolId || undefined,
        employeeId: effectiveEmployeeId,
        financialYear: effectiveFinancialYear,
      }),
    enabled:
      Boolean(payrollContext) &&
      Boolean(effectiveEmployeeId) &&
      Boolean(effectiveFinancialYear),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (month: number) =>
      updatePayrollSettingsMutation(
        { statementStartMonth: month },
        selectedSchoolId || undefined,
      ),
    onSuccess: async () => {
      setStatementStartMonthDraft(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["payroll", "context", selectedSchoolId || "current"],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "payroll",
            "ledger",
            selectedSchoolId || "current",
            effectiveEmployeeId,
            effectiveFinancialYear,
          ],
        }),
      ]);
    },
  });

  const saveLedgerMutation = useMutation({
    mutationFn: (nextRows: PayrollLedgerRowRecord[]) =>
      savePayrollLedgerMutation(
        {
          employeeId: effectiveEmployeeId,
          financialYear: effectiveFinancialYear,
          rows: nextRows.map((row, index) => ({
            id: row.id || undefined,
            rowType: row.rowType,
            rowMonth: row.rowMonth,
            rowLabel: row.rowLabel.trim(),
            displayOrder: index,
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
          })),
        },
        selectedSchoolId || undefined,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [
          "payroll",
          "ledger",
          selectedSchoolId || "current",
          effectiveEmployeeId,
          effectiveFinancialYear,
        ],
      });
    },
  });

  const selectedEmployee = useMemo(
    () =>
      payrollContext?.employees.find(
        (employee) => employee.id === effectiveEmployeeId,
      ) ?? null,
    [payrollContext?.employees, effectiveEmployeeId],
  );

  function handleSchoolChange(nextSchoolId: string) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    setSelectedEmployeeId("");
    setSelectedFinancialYear("");

    if (nextSchoolId) {
      nextSearchParams.set("schoolId", nextSchoolId);
    } else {
      nextSearchParams.delete("schoolId");
    }

    const query = nextSearchParams.toString();
    router.replace(query ? `/payroll?${query}` : "/payroll");
  }

  async function handleDownloadPdf(nextRows: PayrollLedgerRowRecord[]) {
    if (!payrollContext || !ledgerData || !selectedEmployee) {
      return;
    }
    await downloadPayrollPdf({
      school: payrollContext.school,
      employee: selectedEmployee,
      settings: payrollContext.settings,
      financialYear: effectiveFinancialYear,
      rows: nextRows,
    });
  }

  async function handleDownloadMonthlyPdf(
    nextRows: PayrollLedgerRowRecord[],
    monthLabel: string,
  ) {
    if (!payrollContext || !ledgerData || !selectedEmployee) {
      return;
    }
    await downloadPayrollPdf({
      school: payrollContext.school,
      employee: selectedEmployee,
      settings: payrollContext.settings,
      financialYear: effectiveFinancialYear,
      rows: nextRows,
      fileNameSuffix: monthLabel,
    });
  }

  const ledgerEditorKey = useMemo(() => {
    const rowToken =
      ledgerData?.rows.map((row) => `${row.id}:${row.updatedAt}`).join("|") ??
      "empty";
    return [
      selectedSchoolId || "current",
      effectiveEmployeeId,
      effectiveFinancialYear,
      rowToken,
    ].join(":");
  }, [
    effectiveEmployeeId,
    effectiveFinancialYear,
    ledgerData?.rows,
    selectedSchoolId,
  ]);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PayrollWorkspaceAdminSection
        isSchoolsPending={isSchoolsPending}
        onSchoolChange={handleSchoolChange}
        scope={scope}
        schools={schoolsData?.schools ?? []}
        selectedSchoolId={selectedSchoolId ?? ""}
      />

      {(scope === "school" || selectedSchoolId) && isPayrollContextPending ? (
        <PayrollLoadingState />
      ) : null}

      {payrollContextError ? (
        <PayrollErrorState message={payrollContextError.message} />
      ) : null}

      {payrollContext ? (
        <PayrollWorkspaceContent
          effectiveEmployeeId={effectiveEmployeeId}
          effectiveFinancialYear={effectiveFinancialYear}
          isLedgerPending={isLedgerPending}
          isSaving={saveLedgerMutation.isPending}
          ledgerData={ledgerData}
          ledgerEditorKey={ledgerEditorKey}
          ledgerError={ledgerError}
          onDownloadAnnual={handleDownloadPdf}
          onDownloadMonthly={handleDownloadMonthlyPdf}
          onEmployeeChange={setSelectedEmployeeId}
          onFinancialYearChange={setSelectedFinancialYear}
          onSaveRows={saveLedgerMutation.mutate}
          onSaveSettings={() =>
            saveSettingsMutation.mutate(statementStartMonth)
          }
          onStatementMonthChange={(value) =>
            setStatementStartMonthDraft({
              schoolId: payrollContext.school.id,
              value: Number(value),
            })
          }
          payrollContext={payrollContext}
          saveError={saveLedgerMutation.error?.message}
          selectedEmployee={selectedEmployee}
          statementStartMonth={statementStartMonth}
        />
      ) : null}
    </div>
  );
}
