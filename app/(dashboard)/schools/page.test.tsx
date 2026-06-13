// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import SchoolsPage from "@/app/(dashboard)/schools/page";

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

describe("SchoolsPage", () => {
  it("renders the school link and status badge", async () => {
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
                {
                  id: "school-2",
                  schoolName: "North Ridge",
                  principalName: "Sam Principal",
                  address: "2 Main St",
                  tanNo: "TAN124",
                  userId: null,
                  loginEmail: null,
                  isBanned: null,
                  createdAt: "",
                  updatedAt: "",
                },
              ],
            }),
            {
              status: 200,
              headers: {
                "content-type": "application/json",
              },
            },
          );
        }

        throw new Error(`Unexpected request: ${String(input)}`);
      }),
    );

    renderWithQueryClient(<SchoolsPage />);

    const link = await screen.findByRole("link", { name: "Riverdale High" });

    expect(link).toHaveAttribute("href", "/schools/school-1");
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("No Login")).toBeInTheDocument();
  });
});
