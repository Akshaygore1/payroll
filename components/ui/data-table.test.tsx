// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";

type TestRow = {
  id: string;
  name: string;
  role: string;
};

const columns: Array<ColumnDef<TestRow>> = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
  },
];

const rows: TestRow[] = [
  { id: "1", name: "Charlie", role: "Lead" },
  { id: "2", name: "Alice", role: "Manager" },
  { id: "3", name: "Bob", role: "Analyst" },
];

afterEach(() => {
  cleanup();
});

function TestTable({
  data = rows,
  errorMessage,
  isLoading,
}: {
  data?: TestRow[];
  errorMessage?: string;
  isLoading?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 2,
  });

  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="No rows found."
      errorMessage={errorMessage}
      isLoading={isLoading}
      onPaginationChange={setPagination}
      onSearchValueChange={(value) => {
        setSearchValue(value);
        setPagination((current) => ({ ...current, pageIndex: 0 }));
      }}
      onSortingChange={setSorting}
      pagination={pagination}
      renderToolbarEnd={(table) => (
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} rows
        </div>
      )}
      searchPlaceholder="Search rows"
      searchValue={searchValue}
      sorting={sorting}
    />
  );
}

describe("DataTable", () => {
  it("renders typed rows", () => {
    render(<TestTable />);

    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("filters rows with client-side search", async () => {
    const user = userEvent.setup();

    render(<TestTable />);

    await user.type(screen.getByPlaceholderText("Search rows"), "alice");

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    expect(screen.getByText("1 rows")).toBeInTheDocument();
  });

  it("sorts rows when the header is clicked", async () => {
    const user = userEvent.setup();

    render(<TestTable />);

    await user.click(screen.getByRole("button", { name: "Name" }));

    const renderedNames = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.textContent ?? "");

    expect(renderedNames[0]).toContain("Alice");
    expect(renderedNames[1]).toContain("Bob");
  });

  it("paginates visible rows", async () => {
    const user = userEvent.setup();

    render(<TestTable />);

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("renders loading, error, and empty states", () => {
    const { rerender } = render(<TestTable isLoading />);

    expect(document.querySelectorAll("[data-slot='skeleton']").length).toBe(2);

    rerender(<TestTable errorMessage="Something went wrong." />);
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();

    rerender(<TestTable data={[]} />);
    expect(screen.getByText("No rows found.")).toBeInTheDocument();
  });
});
