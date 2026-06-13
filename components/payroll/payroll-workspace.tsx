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

function parseInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="border border-border px-4 py-3">
      <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
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
  value?: string;
}) {
  return (
    <Select disabled={disabled} onValueChange={onValueChange} value={value}>
      <SelectTrigger className="w-full">
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
        className="text-right tabular-nums"
        id={`payroll-${fieldKey}`}
        inputMode="numeric"
        onChange={(event) => onChange(fieldKey, event.target.value)}
        value={String(row[fieldKey])}
      />
    </Field>
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
        <CardTitle>Payroll</CardTitle>
        <CardDescription>
          Select a school first, then manage employee payroll and annual statements.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <Field>
          <FieldLabel>School</FieldLabel>
          <PayrollSelect
            disabled={isPending}
            onValueChange={onSchoolChange}
            placeholder="Select a school"
            value={selectedSchoolId || undefined}
          >
            {schools.map((school) => (
              <SelectItem key={school.id} value={school.id}>
                {school.schoolName}
              </SelectItem>
            ))}
          </PayrollSelect>
        </Field>
        <div className="text-sm text-muted-foreground">
          {isPending ? "Loading schools..." : `${schools.length} schools`}
        </div>
      </CardContent>
    </Card>
  );
}

function PayrollSelectionEmptyState() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a School</CardTitle>
        <CardDescription>
          Payroll becomes available after a school is selected.
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
        <CardTitle>Unable to Load Payroll</CardTitle>
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
        <CardTitle>{payrollSchool.schoolName}</CardTitle>
        <CardDescription>
          Annual payroll ledger and statement setup for the selected school.
        </CardDescription>
        <CardAction>
          <Button onClick={onSaveSettings} size="sm" variant="outline">
            Save Settings
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Principal
            </span>
            <div className="text-sm">{payrollSchool.principalName}</div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              TAN No.
            </span>
            <div className="text-sm">{payrollSchool.tanNo}</div>
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Address
            </span>
            <div className="text-sm">{payrollSchool.address}</div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
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
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
              Employees
            </span>
            <div className="text-sm">{employeeCount} available</div>
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
        <CardTitle>No Employees</CardTitle>
        <CardDescription>
          Add employees before creating payroll rows for this school.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function PayrollFilterCard({
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
        <CardTitle>Ledger Filters</CardTitle>
        <CardDescription>
          Choose an employee and financial year before filling or downloading payroll.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-4">
        <Field>
          <FieldLabel>Employee</FieldLabel>
          <PayrollSelect
            onValueChange={onEmployeeChange}
            placeholder="Select employee"
            value={effectiveEmployeeId || undefined}
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
            value={effectiveFinancialYear || undefined}
          >
            {financialYears.map((financialYear) => (
              <SelectItem key={financialYear} value={financialYear}>
                {financialYear}
              </SelectItem>
            ))}
          </PayrollSelect>
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Designation
          </span>
          <div className="text-sm">{selectedEmployee?.designation ?? "-"}</div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            PAN Number
          </span>
          <div className="text-sm">{selectedEmployee?.panNumber ?? "-"}</div>
        </div>
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
  const [activePanel, setActivePanel] = useState<"fill" | "download" | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const totals = useMemo(() => summarizePayrollRows(rows), [rows]);
  const monthlyRows = useMemo(
    () => rows.filter((row) => row.rowType === "month" && row.rowMonth !== null),
    [rows],
  );
  const selectedMonthlyRow = useMemo(
    () => monthlyRows.find((row) => String(row.rowMonth) === selectedMonth) ?? null,
    [monthlyRows, selectedMonth],
  );

  const monthOptions = useMemo(
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
  }

  function selectedMonthLabel() {
    return monthOptions.find((month) => month.value === selectedMonth)?.label ?? "";
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payroll Actions</CardTitle>
          <CardDescription>
            Fill one monthly payroll entry or download the employee payslip.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            <Button onClick={() => setActivePanel("fill")} size="sm">
              Fill Monthly Payroll
            </Button>
            <Button onClick={() => setActivePanel("download")} size="sm" variant="outline">
              Download Payslip
            </Button>
          </CardAction>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryColumns.map((key) => (
          <SummaryCard
            key={key}
            label={payrollColumnLabels[key]}
            value={totals[key]}
          />
        ))}
      </div>

      {isLoading ? <Skeleton className="h-96" /> : null}
      {loadError ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to Load Ledger</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {activePanel === "fill" ? (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Payroll</CardTitle>
            <CardDescription>
              Select one month and save only that month into the annual ledger.
            </CardDescription>
            <CardAction>
              <Button
                disabled={isSaving || !selectedMonthlyRow}
                onClick={() => onSave(rows)}
                size="sm"
              >
                {isSaving ? "Saving" : "Save"}
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <FieldGroup className="gap-6">
              <Field>
                <FieldLabel>Select Month</FieldLabel>
                <PayrollSelect
                  disabled={!monthOptions.length}
                  onValueChange={setSelectedMonth}
                  placeholder="Select month"
                  value={selectedMonth || undefined}
                >
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </PayrollSelect>
              </Field>

              {selectedMonthlyRow ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {summaryColumns.map((key) => (
                      <SummaryCard
                        key={key}
                        label={payrollColumnLabels[key]}
                        value={selectedMonthlyRow[key]}
                      />
                    ))}
                  </div>

                  <div className="grid gap-8 lg:grid-cols-2">
                    <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                      <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground sm:col-span-2">
                        Earnings
                      </div>
                      <PayrollAmountInput
                        fieldKey="basicPay"
                        onChange={(field, value) =>
                          updateRow(selectedMonthlyRow.rowMonth ?? 0, field, value)
                        }
                        row={selectedMonthlyRow}
                      />
                      {earningFieldKeys.map((key) => (
                        <PayrollAmountInput
                          fieldKey={key}
                          key={key}
                          onChange={(field, value) =>
                            updateRow(selectedMonthlyRow.rowMonth ?? 0, field, value)
                          }
                          row={selectedMonthlyRow}
                        />
                      ))}
                    </FieldGroup>

                    <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
                      <div className="text-xs font-semibold tracking-wider uppercase text-muted-foreground sm:col-span-2">
                        Deductions
                      </div>
                      <PayrollAmountInput
                        fieldKey="recovery"
                        onChange={(field, value) =>
                          updateRow(selectedMonthlyRow.rowMonth ?? 0, field, value)
                        }
                        row={selectedMonthlyRow}
                      />
                      {deductionFieldKeys.map((key) => (
                        <PayrollAmountInput
                          fieldKey={key}
                          key={key}
                          onChange={(field, value) =>
                            updateRow(selectedMonthlyRow.rowMonth ?? 0, field, value)
                          }
                          row={selectedMonthlyRow}
                        />
                      ))}
                    </FieldGroup>
                  </div>
                </>
              ) : null}

              {saveError ? (
                <p className="text-sm text-destructive">{saveError}</p>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}

      {activePanel === "download" ? (
        <Card>
          <CardHeader>
            <CardTitle>Download Payslip</CardTitle>
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
                  onValueChange={setSelectedMonth}
                  placeholder="Select month"
                  value={selectedMonth || undefined}
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
                      ? onDownloadMonthly([selectedMonthlyRow], selectedMonthLabel())
                      : undefined
                  }
                  variant="outline"
                >
                  Download Monthly
                </Button>
                <Button disabled={!rows.length} onClick={() => onDownloadAnnual(rows)}>
                  Download Annual
                </Button>
              </div>
            </FieldGroup>
          </CardContent>
        </Card>
      ) : null}
    </>
  );
}

export function PayrollWorkspace({ scope }: PayrollWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const selectedSchoolId =
    scope === "admin" ? searchParams.get("schoolId") ?? "" : undefined;
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
      payrollContext?.employees.find((employee) => employee.id === effectiveEmployeeId) ??
      null,
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
      ledgerData?.rows.map((row) => `${row.id}:${row.updatedAt}`).join("|") ?? "empty";

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
      {scope === "admin" ? (
        <AdminSchoolPicker
          isPending={isSchoolsPending}
          onSchoolChange={handleSchoolChange}
          schools={schoolsData?.schools ?? []}
          selectedSchoolId={selectedSchoolId ?? ""}
        />
      ) : null}

      {scope === "admin" && !selectedSchoolId ? <PayrollSelectionEmptyState /> : null}

      {(scope === "school" || selectedSchoolId) && isPayrollContextPending ? (
        <PayrollLoadingState />
      ) : null}

      {payrollContextError ? (
        <PayrollErrorState message={payrollContextError.message} />
      ) : null}

      {payrollContext ? (
        <>
          <PayrollSchoolSummary
            employeeCount={payrollContext.employees.length}
            onSaveSettings={() => saveSettingsMutation.mutate(statementStartMonth)}
            onStatementMonthChange={(value) =>
              setStatementStartMonthDraft({
                schoolId: payrollContext.school.id,
                value: Number(value),
              })
            }
            payrollSchool={payrollContext.school}
            statementStartMonth={statementStartMonth}
          />

          {payrollContext.employees.length === 0 ? (
            <PayrollNoEmployeesState />
          ) : (
            <>
              <PayrollFilterCard
                effectiveEmployeeId={effectiveEmployeeId}
                effectiveFinancialYear={effectiveFinancialYear}
                employees={payrollContext.employees}
                financialYears={payrollContext.financialYears}
                onEmployeeChange={setSelectedEmployeeId}
                onFinancialYearChange={setSelectedFinancialYear}
                selectedEmployee={selectedEmployee}
              />

              <PayrollMonthlyWorkspace
                financialYear={effectiveFinancialYear}
                initialRows={ledgerData?.rows ?? []}
                isLoading={isLedgerPending}
                isSaving={saveLedgerMutation.isPending}
                key={ledgerEditorKey}
                loadError={ledgerError?.message}
                onDownloadAnnual={handleDownloadPdf}
                onDownloadMonthly={handleDownloadMonthlyPdf}
                onSave={saveLedgerMutation.mutate}
                saveError={saveLedgerMutation.error?.message}
                statementStartMonth={statementStartMonth}
              />
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
