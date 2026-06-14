// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/app-sidebar";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => <button type="button">Sign out</button>,
}));

vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SidebarMenuButton: ({
    asChild,
    children,
  }: {
    asChild?: boolean;
    children: React.ReactNode;
  }) => (asChild ? <>{children}</> : <button type="button">{children}</button>),
  SidebarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("AppSidebar", () => {
  it("links the admin payroll and payslip nav entries to their routes", () => {
    mockUsePathname.mockReturnValue("/payslip");

    render(
      <AppSidebar
        user={{ email: "admin@example.com", name: "Admin", role: "admin" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Payroll" })).toHaveAttribute(
      "href",
      "/payroll",
    );
    expect(screen.getByRole("link", { name: "Payslip" })).toHaveAttribute(
      "href",
      "/payslip",
    );
  });

  it("links the school payroll and payslip nav entries to their routes", () => {
    mockUsePathname.mockReturnValue("/school/payslip");

    render(
      <AppSidebar
        user={{ email: "school@example.com", name: "School", role: "school" }}
      />,
    );

    expect(screen.getByRole("link", { name: "Payroll" })).toHaveAttribute(
      "href",
      "/school/payroll",
    );
    expect(screen.getByRole("link", { name: "Payslip" })).toHaveAttribute(
      "href",
      "/school/payslip",
    );
  });
});
