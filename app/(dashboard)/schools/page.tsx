"use client";

import type {
  ColumnDef,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { SchoolStatusBadge } from "@/components/schools/school-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { listSchoolsQuery, type SchoolRecord } from "@/lib/schools/api";

export default function SchoolsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, error, isPending } = useQuery({
    queryKey: ["schools"],
    queryFn: listSchoolsQuery,
  });

  const schools = data?.schools ?? [];
  const columns: Array<ColumnDef<SchoolRecord>> = [
    {
      accessorKey: "schoolName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="School" />
      ),
      cell: ({ row }) => (
        <Link
          className="font-medium underline-offset-4 hover:underline"
          href={`/schools/${row.original.id}`}
        >
          {row.original.schoolName}
        </Link>
      ),
    },
    {
      accessorKey: "principalName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Principal" />
      ),
    },
    {
      accessorKey: "tanNo",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="TAN No." />
      ),
    },
    {
      accessorKey: "loginEmail",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Login" />
      ),
      cell: ({ row }) => row.original.loginEmail ?? "Not assigned",
    },
    {
      accessorFn: (school) => {
        if (!school.userId) {
          return "No Login";
        }

        return school.isBanned ? "Inactive" : "Active";
      },
      id: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => (
        <SchoolStatusBadge
          isBanned={row.original.isBanned}
          userId={row.original.userId}
        />
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schools</CardTitle>
        <CardDescription>
          Manage school profiles, linked logins, and access state.
        </CardDescription>
        <CardAction>
          <Button asChild size="sm">
            <Link href="/schools/new">Add School</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={schools}
          emptyMessage="No schools found."
          errorMessage={error?.message}
          isLoading={isPending}
          onPaginationChange={setPagination}
          onSearchValueChange={(value) => {
            setSearchValue(value);
            setPagination((current) => ({ ...current, pageIndex: 0 }));
          }}
          onSortingChange={setSorting}
          pagination={pagination}
          searchPlaceholder="Search schools"
          searchValue={searchValue}
          sorting={sorting}
        />
      </CardContent>
    </Card>
  );
}
