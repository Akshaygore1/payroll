"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
  type PayrollLedgerRowRecord,
} from "@/lib/payroll/api";
import { downloadPayrollPdf } from "@/lib/payroll/pdf";
import { listSchoolsQuery } from "@/lib/schools/api";

type PayslipWorkspaceProps = {
  scope: "admin" | "school";
};

type DownloadType = "monthly" | "annual";
type PayrollContextData = Awaited<ReturnType<typeof getPayrollContextQuery>>;
type PayrollEmployee = PayrollContextData["employees"][number];
type PayrollMonthOption = { label: string; value: string };

function WorkspaceSelect({
  ariaLabel,
  children,
  disabled,
  onValueChange,
  placeholder,
  value,
}: {
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <Select disabled={disabled} onValueChange={onValueChange} value={value}>
      <SelectTrigger aria-label={ariaLabel} className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>{children}</SelectGroup>
      </SelectContent>
    </Select>
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
        <CardTitle className="mt-2 font-display text-lg font-bold">
          Select School
        </CardTitle>
        <CardDescription>
          Choose a school before downloading employee payslips.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <Field>
          <FieldLabel>School</FieldLabel>
          <WorkspaceSelect
            ariaLabel="School"
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
          </WorkspaceSelect>
        </Field>
        <div className="text-sm text-muted-foreground">
          {isPending ? "Loading..." : `${schools.length} schools`}
        </div>
      </CardContent>
    </Card>
  );
}

function PayslipSelectionEmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold">
          Payslip
        </CardTitle>
        <CardDescription>
          Select a school above to load the payslip download workspace.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function PayslipLoadingState() {
  return (
    <div className="grid gap-6">
      <Skeleton className="h-36" />
      <Skeleton className="h-72" />
    </div>
  );
}

function PayslipErrorState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold">
          {title}
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function PayslipNoEmployeesState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg font-bold">
          No Employees
        </CardTitle>
        <CardDescription>
          Add employees before downloading payslips for this school.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function PayslipDownloadCard({
  downloadType,
  employees,
  financialYears,
  monthError,
  monthOptions,
  onDownload,
  onDownloadTypeChange,
  onEmployeeChange,
  onFinancialYearChange,
  onMonthChange,
  selectedEmployee,
  selectedEmployeeId,
  selectedFinancialYear,
  selectedMonth,
  schoolName,
  isDownloadDisabled,
  isLedgerLoading,
}: {
  downloadType: DownloadType;
  employees: PayrollEmployee[];
  financialYears: string[];
  monthError: string | null;
  monthOptions: PayrollMonthOption[];
  onDownload: () => void;
  onDownloadTypeChange: (value: DownloadType) => void;
  onEmployeeChange: (value: string) => void;
  onFinancialYearChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  selectedEmployee: PayrollEmployee | null;
  selectedEmployeeId: string;
  selectedFinancialYear: string;
  selectedMonth: string;
  schoolName: string;
  isDownloadDisabled: boolean;
  isLedgerLoading: boolean;
}) {
  const showLedgerLoadingMessage =
    isLedgerLoading && Boolean(selectedEmployeeId) && Boolean(selectedFinancialYear);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="mt-2 font-display text-lg font-bold">
          Download Payslip
        </CardTitle>
        <CardDescription>
          Download monthly or annual payslips for {schoolName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="gap-6">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => onDownloadTypeChange("monthly")}
              size="sm"
              variant={downloadType === "monthly" ? "default" : "outline"}
            >
              Monthly
            </Button>
            <Button
              onClick={() => onDownloadTypeChange("annual")}
              size="sm"
              variant={downloadType === "annual" ? "default" : "outline"}
            >
              Annual
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Field>
              <FieldLabel>Employee</FieldLabel>
              <WorkspaceSelect
                ariaLabel="Employee"
                onValueChange={onEmployeeChange}
                placeholder="Select employee"
                value={selectedEmployeeId}
              >
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </SelectItem>
                ))}
              </WorkspaceSelect>
            </Field>

            <Field>
              <FieldLabel>Financial Year</FieldLabel>
              <WorkspaceSelect
                ariaLabel="Financial Year"
                onValueChange={onFinancialYearChange}
                placeholder="Select financial year"
                value={selectedFinancialYear}
              >
                {financialYears.map((financialYear) => (
                  <SelectItem key={financialYear} value={financialYear}>
                    {financialYear}
                  </SelectItem>
                ))}
              </WorkspaceSelect>
            </Field>

            {downloadType === "monthly" ? (
              <Field>
                <FieldLabel>Month</FieldLabel>
                <WorkspaceSelect
                  ariaLabel="Month"
                  disabled={!monthOptions.length || isLedgerLoading}
                  onValueChange={onMonthChange}
                  placeholder="Select month"
                  value={selectedMonth}
                >
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </WorkspaceSelect>
              </Field>
            ) : null}

            <div className="flex flex-col justify-end gap-1 pb-2">
              <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
                Designation
              </span>
              <div className="text-sm">{selectedEmployee?.designation ?? "-"}</div>
            </div>
          </div>

          {monthError ? (
            <div className="text-sm text-destructive">{monthError}</div>
          ) : null}

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {showLedgerLoadingMessage
                ? "Loading payslip data..."
                : "Choose the required filters, then download the PDF."}
            </div>
            <Button disabled={isDownloadDisabled} onClick={onDownload}>
              Download
            </Button>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

export function PayslipWorkspace({ scope }: PayslipWorkspaceProps) {
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [downloadType, setDownloadType] = useState<DownloadType>("monthly");

  const { data: schoolsData, error: schoolsError, isPending: isSchoolsPending } =
    useQuery({
      queryKey: ["schools"],
      queryFn: listSchoolsQuery,
      enabled: scope === "admin",
    });

  const contextSchoolId = scope === "admin" ? selectedSchoolId : undefined;

  const {
    data: payrollContext,
    error: payrollContextError,
    isPending: isPayrollContextPending,
  } = useQuery({
    queryKey: ["payslip", "context", contextSchoolId || "current"],
    queryFn: () => getPayrollContextQuery(contextSchoolId || undefined),
    enabled: scope === "school" || Boolean(contextSchoolId),
  });

  const effectiveEmployeeId = useMemo(() => {
    if (!payrollContext) {
      return "";
    }

    return payrollContext.employees.some((employee) => employee.id === selectedEmployeeId)
      ? selectedEmployeeId
      : "";
  }, [payrollContext, selectedEmployeeId]);

  const effectiveFinancialYear = useMemo(() => {
    if (!payrollContext) {
      return "";
    }

    return payrollContext.financialYears.includes(selectedFinancialYear)
      ? selectedFinancialYear
      : "";
  }, [payrollContext, selectedFinancialYear]);

  const {
    data: ledgerData,
    error: ledgerError,
    isPending: isLedgerPending,
  } = useQuery({
    queryKey: [
      "payslip",
      "ledger",
      contextSchoolId || "current",
      effectiveEmployeeId,
      effectiveFinancialYear,
    ],
    queryFn: () =>
      getPayrollLedgerQuery({
        schoolId: contextSchoolId || undefined,
        employeeId: effectiveEmployeeId,
        financialYear: effectiveFinancialYear,
      }),
    enabled:
      Boolean(payrollContext) &&
      Boolean(effectiveEmployeeId) &&
      Boolean(effectiveFinancialYear),
  });

  const selectedEmployee = useMemo(
    () => payrollContext?.employees.find((employee) => employee.id === effectiveEmployeeId) ?? null,
    [effectiveEmployeeId, payrollContext?.employees],
  );

  const monthlyRows = useMemo(
    () =>
      (ledgerData?.rows ?? []).filter(
        (row) => row.rowType === "month" && row.rowMonth !== null,
      ),
    [ledgerData?.rows],
  );

  const monthOptions = useMemo<PayrollMonthOption[]>(
    () =>
      monthlyRows.map((row) => ({
        label: getRowPeriodLabel(
          effectiveFinancialYear,
          payrollContext?.settings.statementStartMonth ?? 4,
          row,
        ),
        value: String(row.rowMonth),
      })),
    [effectiveFinancialYear, monthlyRows, payrollContext?.settings],
  );

  const selectedMonthlyRow = useMemo(
    () =>
      monthlyRows.find((row) => String(row.rowMonth) === selectedMonth) ?? null,
    [monthlyRows, selectedMonth],
  );

  const effectiveSelectedMonth = monthOptions.some(
    (month) => month.value === selectedMonth,
  )
    ? selectedMonth
    : "";

  const monthError =
    downloadType === "monthly" && effectiveSelectedMonth && !selectedMonthlyRow
      ? "No matching month row is available for this employee and financial year."
      : null;

  const isDownloadDisabled =
    !payrollContext ||
    !selectedEmployee ||
    !effectiveFinancialYear ||
    isLedgerPending ||
    Boolean(ledgerError) ||
    (downloadType === "monthly"
      ? !effectiveSelectedMonth || !selectedMonthlyRow
      : !(ledgerData?.rows.length ?? 0));

  async function handleDownload() {
    if (
      !payrollContext ||
      !selectedEmployee ||
      !effectiveFinancialYear ||
      !ledgerData
    ) {
      return;
    }

    const rows: PayrollLedgerRowRecord[] =
      downloadType === "annual"
        ? ledgerData.rows
        : selectedMonthlyRow
          ? [selectedMonthlyRow]
          : [];

    if (!rows.length) {
      return;
    }

    const selectedMonthLabel =
      monthOptions.find((month) => month.value === effectiveSelectedMonth)?.label ??
      "";

    await downloadPayrollPdf({
      school: payrollContext.school,
      employee: selectedEmployee,
      settings: payrollContext.settings,
      financialYear: effectiveFinancialYear,
      rows,
      fileNameSuffix:
        downloadType === "monthly" ? selectedMonthLabel : undefined,
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        description="Download employee payslips using the existing payroll ledger for each school and financial year."
        title="Payslip"
      />

      {scope === "admin" ? (
        <>
          {schoolsError ? (
            <PayslipErrorState
              message={schoolsError.message}
              title="Unable to Load Schools"
            />
          ) : (
            <AdminSchoolPicker
              isPending={isSchoolsPending}
              onSchoolChange={(value) => {
                setSelectedSchoolId(value);
                setSelectedEmployeeId("");
                setSelectedFinancialYear("");
                setSelectedMonth("");
              }}
              schools={schoolsData?.schools ?? []}
              selectedSchoolId={selectedSchoolId}
            />
          )}

          {!selectedSchoolId ? <PayslipSelectionEmptyState /> : null}
        </>
      ) : null}

      {(scope === "school" || selectedSchoolId) && isPayrollContextPending ? (
        <PayslipLoadingState />
      ) : null}

      {payrollContextError ? (
        <PayslipErrorState
          message={payrollContextError.message}
          title="Unable to Load Payroll"
        />
      ) : null}

      {payrollContext && payrollContext.employees.length === 0 ? (
        <PayslipNoEmployeesState />
      ) : null}

      {payrollContext && payrollContext.employees.length > 0 ? (
        <div className="flex min-w-0 flex-col gap-6">
          <PayslipDownloadCard
            downloadType={downloadType}
            employees={payrollContext.employees}
            financialYears={payrollContext.financialYears}
            isDownloadDisabled={isDownloadDisabled}
            isLedgerLoading={isLedgerPending}
            monthError={monthError}
            monthOptions={monthOptions}
            onDownload={() => {
              void handleDownload();
            }}
            onDownloadTypeChange={(value) => {
              setDownloadType(value);
              if (value === "annual") {
                setSelectedMonth("");
              }
            }}
            onEmployeeChange={(value) => {
              setSelectedEmployeeId(value);
              setSelectedMonth("");
            }}
            onFinancialYearChange={(value) => {
              setSelectedFinancialYear(value);
              setSelectedMonth("");
            }}
            onMonthChange={setSelectedMonth}
            schoolName={payrollContext.school.schoolName}
            selectedEmployee={selectedEmployee}
            selectedEmployeeId={effectiveEmployeeId}
            selectedFinancialYear={effectiveFinancialYear}
            selectedMonth={effectiveSelectedMonth}
          />

          {ledgerError ? (
            <PayslipErrorState
              message={ledgerError.message}
              title="Unable to Load Ledger"
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
