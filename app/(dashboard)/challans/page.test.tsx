// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import ChallansPage from "@/app/(dashboard)/challans/page";

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

async function chooseOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
) {
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

describe("ChallansPage", () => {
  it("keeps download disabled until a school and financial year are selected", async () => {
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
          return new Response(
            JSON.stringify({
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
              employees: [],
              financialYears: ["2024-25", "2023-24"],
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        }

        throw new Error(`Unexpected request: ${String(input)}`);
      }),
    );

    const user = userEvent.setup();

    renderWithQueryClient(<ChallansPage />);

    expect(await screen.findByText("1 schools")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Select a school first, then choose a financial year to download the workbook.",
      ),
    ).toBeInTheDocument();

    const downloadButton = screen.queryByRole("button", { name: "Download" });
    expect(downloadButton).not.toBeInTheDocument();

    await chooseOption(user, "School", "Riverdale High");

    const actionButton = await screen.findByRole("button", { name: "Download" });
    expect(actionButton).toBeDisabled();

    await chooseOption(user, "Financial Year", "2024-25");

    await waitFor(() => {
      expect(actionButton).toBeEnabled();
    });
  });

  it("shows an error state when the admin APIs reject access", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/schools") {
          return new Response(JSON.stringify({ error: "Forbidden" }), {
            status: 403,
            headers: { "content-type": "application/json" },
          });
        }

        throw new Error(`Unexpected request: ${String(input)}`);
      }),
    );

    renderWithQueryClient(<ChallansPage />);

    expect(
      await screen.findByText("Unable to load challans workspace"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Forbidden")).toBeInTheDocument();
  });
});
