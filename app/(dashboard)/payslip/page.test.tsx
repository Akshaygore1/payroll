// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import PayslipPage from "@/app/(dashboard)/payslip/page";
import SchoolPayslipPage from "@/app/(dashboard)/school/payslip/page";
import { downloadPayrollPdf } from "@/lib/payroll/pdf";

vi.mock("@/lib/payroll/pdf", () => ({
  downloadPayrollPdf: vi.fn(),
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");

  function SelectItem(props: { children: React.ReactNode; value: string }) {
    return React.createElement("select-item", props, props.children);
  }

  SelectItem.displayName = "MockSelectItem";

  function SelectValue(props: { placeholder?: string }) {
    return React.createElement("select-value", props);
  }

  SelectValue.displayName = "MockSelectValue";

  function SelectTrigger(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return React.createElement("select-trigger", props);
  }

  SelectTrigger.displayName = "MockSelectTrigger";

  function SelectGroup({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  function SelectContent({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  }

  function findItems(node: React.ReactNode): Array<{ value: string; label: string }> {
    const items: Array<{ value: string; label: string }> = [];

    React.Children.forEach(node, (child) => {
      if (!React.isValidElement(child)) {
        return;
      }

      if ((child.type as { displayName?: string }).displayName === "MockSelectItem") {
        items.push({
          value: String(child.props.value),
          label: String(child.props.children),
        });
        return;
      }

      if (child.props?.children) {
        items.push(...findItems(child.props.children));
      }
    });

    return items;
  }

  function findTrigger(node: React.ReactNode): Record<string, unknown> | null {
    let triggerProps: Record<string, unknown> | null = null;

    React.Children.forEach(node, (child) => {
      if (triggerProps || !React.isValidElement(child)) {
        return;
      }

      if ((child.type as { displayName?: string }).displayName === "MockSelectTrigger") {
        triggerProps = child.props as Record<string, unknown>;
        return;
      }

      if (child.props?.children) {
        triggerProps = findTrigger(child.props.children);
      }
    });

    return triggerProps;
  }

  function findPlaceholder(node: React.ReactNode): string | undefined {
    let placeholder: string | undefined;

    React.Children.forEach(node, (child) => {
      if (placeholder || !React.isValidElement(child)) {
        return;
      }

      if ((child.type as { displayName?: string }).displayName === "MockSelectValue") {
        placeholder = child.props.placeholder as string | undefined;
        return;
      }

      if (child.props?.children) {
        placeholder = findPlaceholder(child.props.children);
      }
    });

    return placeholder;
  }

  function Select({
    children,
    disabled,
    onValueChange,
    value,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onValueChange?: (value: string) => void;
    value?: string;
  }) {
    const items = findItems(children);
    const triggerProps = findTrigger(children) ?? {};
    const placeholder = findPlaceholder(children);

    return (
      <select
        aria-label={String(triggerProps["aria-label"] ?? "")}
        className={String(triggerProps.className ?? "")}
        disabled={disabled}
        onChange={(event) => onValueChange?.(event.target.value)}
        value={value ?? ""}
      >
        <option value="">{placeholder ?? "Select"}</option>
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    );
  }

  return {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderWithQueryClient(node: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
  );
}

function createContextResponse() {
  return {
    school: {
      id: "school-1",
      schoolName: "Riverdale High",
      principalName: "Mary Principal",
      address: "1 Main St",
      tanNo: "TAN123",
    },
    settings: {
      id: "settings-1",
      schoolId: "school-1",
      statementStartMonth: 4,
      createdAt: "",
      updatedAt: "",
    },
    employees: [
      {
        id: "employee-1",
        fullName: "Alice Johnson",
        designation: "Teacher",
        panNumber: "PAN123",
        gpfNumber: "GPF123",
        pfNumber: "PF123",
        npsAccountNumber: "NPS123",
        contactNumber: "9999999999",
      },
    ],
    financialYears: ["2024-25", "2023-24"],
  };
}

function createLedgerResponse() {
  return {
    school: {
      id: "school-1",
      schoolName: "Riverdale High",
      principalName: "Mary Principal",
      address: "1 Main St",
      tanNo: "TAN123",
    },
    employee: {
      id: "employee-1",
      fullName: "Alice Johnson",
      designation: "Teacher",
      panNumber: "PAN123",
      gpfNumber: "GPF123",
      pfNumber: "PF123",
      npsAccountNumber: "NPS123",
      contactNumber: "9999999999",
    },
    settings: {
      id: "settings-1",
      schoolId: "school-1",
      statementStartMonth: 4,
      createdAt: "",
      updatedAt: "",
    },
    financialYear: "2024-25",
    rows: [
      {
        id: "row-1",
        schoolId: "school-1",
        employeeId: "employee-1",
        financialYear: "2024-25",
        rowType: "month",
        rowMonth: 4,
        rowLabel: "Apr-24",
        displayOrder: 0,
        basicPay: 1000,
        totalPay: 1000,
        da: 100,
        daDifferenceArrears: 0,
        hra: 200,
        cla: 50,
        vaTaArrear: 0,
        totalEarnings: 1350,
        recovery: 0,
        grandTotal: 1350,
        gpf: 50,
        rd: 25,
        cmFund: 0,
        professionalTax: 0,
        revenueStamp: 0,
        incomeTax: 0,
        lic: 0,
        totalDeduction: 75,
        netSalary: 1275,
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "row-2",
        schoolId: "school-1",
        employeeId: "employee-1",
        financialYear: "2024-25",
        rowType: "month",
        rowMonth: 5,
        rowLabel: "May-24",
        displayOrder: 1,
        basicPay: 1000,
        totalPay: 1000,
        da: 100,
        daDifferenceArrears: 0,
        hra: 200,
        cla: 50,
        vaTaArrear: 0,
        totalEarnings: 1350,
        recovery: 0,
        grandTotal: 1350,
        gpf: 50,
        rd: 25,
        cmFund: 0,
        professionalTax: 0,
        revenueStamp: 0,
        incomeTax: 0,
        lic: 0,
        totalDeduction: 75,
        netSalary: 1275,
        createdAt: "",
        updatedAt: "",
      },
    ],
  };
}

async function chooseOption(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  const select = screen.getByRole("combobox", { name: label });

  await waitFor(() => {
    expect(select).toBeEnabled();
    expect(
      Array.from((select as HTMLSelectElement).options).some(
        (currentOption) => currentOption.textContent === option,
      ),
    ).toBe(true);
  });

  await user.selectOptions(select, option);
}

describe("Payslip pages", () => {
  it("shows the school selector before an admin chooses a school and then loads the download controls", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/schools") {
          return new Response(
            JSON.stringify({
              schools: [
                {
                  id: "school-1",
                  schoolName: "Riverdale High",
                  principalName: "Mary Principal",
                  address: "1 Main St",
                  tanNo: "TAN123",
                  userId: "user-1",
                  loginEmail: "riverdale@example.com",
                  isBanned: false,
                  createdAt: "",
                  updatedAt: "",
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (String(input) === "/api/payroll/context?schoolId=school-1") {
          return new Response(JSON.stringify(createContextResponse()), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        throw new Error(`Unexpected request: ${String(input)}`);
      }),
    );

    const user = userEvent.setup();

    renderWithQueryClient(<PayslipPage />);

    expect(screen.getByText("Select School")).toBeInTheDocument();
    expect(screen.getByText("Select a school above to load the payslip download workspace.")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Employee" })).not.toBeInTheDocument();
    expect(await screen.findByText("1 schools")).toBeInTheDocument();

    await chooseOption(user, "School", "Riverdale High");

    expect(await screen.findByRole("combobox", { name: "Employee" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Financial Year" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Month" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Annual" }));

    await waitFor(() => {
      expect(screen.queryByRole("combobox", { name: "Month" })).not.toBeInTheDocument();
    });
  });

  it("downloads annual and monthly PDFs with the expected rows", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/schools") {
          return new Response(
            JSON.stringify({
              schools: [
                {
                  id: "school-1",
                  schoolName: "Riverdale High",
                  principalName: "Mary Principal",
                  address: "1 Main St",
                  tanNo: "TAN123",
                  userId: "user-1",
                  loginEmail: "riverdale@example.com",
                  isBanned: false,
                  createdAt: "",
                  updatedAt: "",
                },
              ],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        if (String(input) === "/api/payroll/context?schoolId=school-1") {
          return new Response(JSON.stringify(createContextResponse()), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        if (
          String(input) ===
          "/api/payroll/ledger?employeeId=employee-1&financialYear=2024-25&schoolId=school-1"
        ) {
          return new Response(JSON.stringify(createLedgerResponse()), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        throw new Error(`Unexpected request: ${String(input)}`);
      }),
    );

    const user = userEvent.setup();

    renderWithQueryClient(<PayslipPage />);

    expect(await screen.findByText("1 schools")).toBeInTheDocument();
    await chooseOption(user, "School", "Riverdale High");
    await chooseOption(user, "Employee", "Alice Johnson");
    await chooseOption(user, "Financial Year", "2024-25");
    await chooseOption(user, "Month", "Apr-24");

    await user.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(downloadPayrollPdf).toHaveBeenCalledWith(
        expect.objectContaining({
          rows: [expect.objectContaining({ id: "row-1" })],
          fileNameSuffix: "Apr-24",
        }),
      );
    });

    await user.click(screen.getByRole("button", { name: "Annual" }));
    await user.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(downloadPayrollPdf).toHaveBeenLastCalledWith(
        expect.objectContaining({
          rows: [
            expect.objectContaining({ id: "row-1" }),
            expect.objectContaining({ id: "row-2" }),
          ],
          fileNameSuffix: undefined,
        }),
      );
    });
  });

  it("loads the school route without a school selector and keeps download disabled until required selections exist", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/payroll/context") {
          return new Response(JSON.stringify(createContextResponse()), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        if (
          String(input) ===
          "/api/payroll/ledger?employeeId=employee-1&financialYear=2024-25"
        ) {
          return new Response(JSON.stringify(createLedgerResponse()), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        }

        throw new Error(`Unexpected request: ${String(input)}`);
      }),
    );

    const user = userEvent.setup();

    renderWithQueryClient(<SchoolPayslipPage />);

    expect(screen.queryByRole("combobox", { name: "School" })).not.toBeInTheDocument();

    const downloadButton = await screen.findByRole("button", { name: "Download" });

    expect(downloadButton).toBeDisabled();

    await chooseOption(user, "Employee", "Alice Johnson");
    expect(downloadButton).toBeDisabled();

    await chooseOption(user, "Financial Year", "2024-25");
    expect(downloadButton).toBeDisabled();

    await chooseOption(user, "Month", "Apr-24");

    await waitFor(() => {
      expect(downloadButton).toBeEnabled();
    });
  });
});
