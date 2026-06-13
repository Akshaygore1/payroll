// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import SchoolEmployeesPage from "@/app/(dashboard)/school/employees/page";

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
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>,
  );
}

describe("SchoolEmployeesPage", () => {
  it("keeps action buttons aligned with the visible row after sorting, filtering, and pagination", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/school/employees") {
          return new Response(
            JSON.stringify({
              employees: [
                "Alpha",
                "Bravo",
                "Charlie",
                "Delta",
                "Echo",
                "Foxtrot",
                "Golf",
                "Hotel",
                "India",
                "Juliet",
                "Kilo",
              ].map((name, index) => ({
                id: `employee-${index + 1}`,
                schoolId: "school-1",
                fullName: name,
                designation: `Designation ${index + 1}`,
                panNumber: `PAN${index + 1}`,
                gpfNumber: `GPF${index + 1}`,
                pfNumber: `PF${index + 1}`,
                npsAccountNumber: `NPS${index + 1}`,
                whatsappNumber: `90000000${index + 1}`,
                contactNumber: `80000000${index + 1}`,
                createdAt: "",
                updatedAt: "",
              })),
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

    const user = userEvent.setup();

    renderWithQueryClient(<SchoolEmployeesPage />);

    await screen.findByText("Alpha");

    await user.click(screen.getByRole("button", { name: "Full Name" }));
    await user.click(screen.getByRole("button", { name: "Full Name" }));

    expect(screen.getByRole("button", { name: "Edit Kilo" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Alpha" }),
    ).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search employees"), "Bravo");

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Delete Bravo" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: "Delete Kilo" }),
    ).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search employees"));
    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Edit Alpha" }),
      ).toBeInTheDocument();
    });
  });
});
