// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import PayrollPage from "@/app/(dashboard)/payroll/page";
import SchoolPayrollPage from "@/app/(dashboard)/school/payroll/page";

vi.mock("@/components/payroll/payroll-workspace", () => ({
  PayrollWorkspace: ({ scope }: { scope: "admin" | "school" }) => (
    <div>Payroll workspace scope: {scope}</div>
  ),
}));

afterEach(() => {
  cleanup();
});

describe("Payroll pages", () => {
  it("renders the admin payroll workspace", () => {
    render(<PayrollPage />);

    expect(
      screen.getByText("Payroll workspace scope: admin"),
    ).toBeInTheDocument();
  });

  it("renders the school payroll workspace", () => {
    render(<SchoolPayrollPage />);

    expect(
      screen.getByText("Payroll workspace scope: school"),
    ).toBeInTheDocument();
  });
});
