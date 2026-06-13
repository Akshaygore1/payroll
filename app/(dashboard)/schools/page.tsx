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
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, DataTableColumnHeader } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { listSchoolsQuery, type SchoolRecord } from "@/lib/schools/api";

export default function SchoolsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, error, isPending } = useQuery({
    queryKey: ["schools"],
    queryFn: listSchoolsQuery,
  });

  const schools = data?.schools ?? [];

  const total = schools.length;
  const active = schools.filter((s) => !!s.userId && !s.isBanned).length;
  const inactive = schools.filter((s) => !!s.userId && s.isBanned).length;
  const noLogin = schools.filter((s) => !s.userId).length;

  const columns: Array<ColumnDef<SchoolRecord>> = [
    {
      accessorKey: "schoolName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="School" />
      ),
      cell: ({ row }) => (
        <Link
          className="font-display font-bold underline-offset-4 hover:underline"
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
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <PageHeader
          title="Schools"
          description="Manage school profiles, linked logins, and access state."
          action={
            <Button asChild size="sm">
              <Link href="/schools/new">Add School</Link>
            </Button>
          }
        />
      </div>

      <div className="animate-fade-in-up-delay-1 grid gap-4 sm:grid-cols-4">
        <div className="border border-border-card px-4 py-3">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Total
          </div>
          <div className="mt-1 font-mono text-xl font-bold">
            {isPending ? <Skeleton className="h-6 w-8" /> : total}
          </div>
        </div>
        <div className="border border-border-card px-4 py-3">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Active
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-accent">
            {isPending ? <Skeleton className="h-6 w-8" /> : stats.active}
          </div>
        </div>
        <div className="border border-border-card px-4 py-3">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            Inactive
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-destructive">
            {isPending ? <Skeleton className="h-6 w-8" /> : stats.inactive}
          </div>
        </div>
        <div className="border border-border-card px-4 py-3">
          <div className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            No Login
          </div>
          <div className="mt-1 font-mono text-xl font-bold text-muted-foreground">
            {isPending ? <Skeleton className="h-6 w-8" /> : stats.noLogin}
          </div>
        </div>
      </div>

      <div className="animate-fade-in-up-delay-2">
        <Card>
          <CardContent className="pt-6">
            <DataTable
              columns={columns}
              data={schools}
              emptyMessage="No schools found."
              errorMessage={error?.message}
              isLoading={isPending}
              onPaginationChange={setPagination}
              onSortingChange={setSorting}
              pagination={pagination}
              sorting={sorting}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
