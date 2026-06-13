"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
  type Table as TanStackTable,
  type Updater,
} from "@tanstack/react-table";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    headerClassName?: string;
    cellClassName?: string;
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

type DataTableProps<TData, TValue> = {
  columns: Array<ColumnDef<TData, TValue>>;
  data: TData[];
  emptyMessage: string;
  errorMessage?: string;
  isLoading?: boolean;
  sorting: SortingState;
  onSortingChange: (updater: Updater<SortingState>) => void;
  pagination: PaginationState;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  searchPlaceholder?: string;
  renderToolbarEnd?: (table: TanStackTable<TData>) => ReactNode;
};

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
};

function getSortIcon(direction: false | "asc" | "desc") {
  if (direction === "asc") {
    return ArrowUp01Icon;
  }

  if (direction === "desc") {
    return ArrowDown01Icon;
  }

  return ArrowUpDownIcon;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return title;
  }

  return (
    <Button
      className="-ml-3 h-auto px-3 py-2"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      size="xs"
      type="button"
      variant="ghost"
    >
      {title}
      <HugeiconsIcon
        aria-hidden="true"
        className="text-muted-foreground"
        icon={getSortIcon(column.getIsSorted())}
      />
    </Button>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage,
  errorMessage,
  isLoading = false,
  sorting,
  onSortingChange,
  pagination,
  onPaginationChange,
  searchValue,
  onSearchValueChange,
  searchPlaceholder,
  renderToolbarEnd,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      globalFilter: searchValue,
    },
    onSortingChange,
    onPaginationChange,
    onGlobalFilterChange: onSearchValueChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const pageCount = Math.max(1, table.getPageCount());
  const columnCount = Math.max(1, table.getAllLeafColumns().length);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        {searchValue !== undefined && onSearchValueChange ? (
          <div className="relative max-w-64">
            <HugeiconsIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              icon={Search01Icon}
            />
            <Input
              className="pl-9"
              onChange={(e) => onSearchValueChange(e.target.value)}
              placeholder={searchPlaceholder ?? "Search..."}
              value={searchValue}
            />
          </div>
        ) : <div />}
        {renderToolbarEnd ? (
          <div className="flex items-center justify-end">
            {renderToolbarEnd(table)}
          </div>
        ) : null}
      </div>

      <div className="border border-border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    className={header.column.columnDef.meta?.headerClassName}
                    key={header.id}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <>
                <TableRow>
                  <TableCell colSpan={columnCount}>
                    <Skeleton className="h-10" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={columnCount}>
                    <Skeleton className="h-10" />
                  </TableCell>
                </TableRow>
              </>
            ) : null}
            {!isLoading && errorMessage ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={columnCount}
                >
                  {errorMessage}
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading &&
            !errorMessage &&
            table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={columnCount}
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : null}
            {!isLoading && !errorMessage
              ? table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        className={cell.column.columnDef.meta?.cellClassName}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Page {Math.min(table.getState().pagination.pageIndex + 1, pageCount)}{" "}
          of {pageCount}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            type="button"
            variant="outline"
          >
            <HugeiconsIcon data-icon="inline-start" icon={ChevronLeftIcon} />
            Previous
          </Button>
          <Button
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            type="button"
            variant="outline"
          >
            Next
            <HugeiconsIcon data-icon="inline-end" icon={ChevronRightIcon} />
          </Button>
        </div>
      </div>
    </div>
  );
}
