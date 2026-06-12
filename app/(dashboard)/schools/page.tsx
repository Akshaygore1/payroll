"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { listSchoolsQuery } from "@/lib/schools/api";

export default function SchoolsPage() {
  const { data, error, isPending } = useQuery({
    queryKey: ["schools"],
    queryFn: listSchoolsQuery,
  });
  const schools = data?.schools ?? [];

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>School</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>TAN No.</TableHead>
              <TableHead>Login</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <>
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-10" />
                  </TableCell>
                </TableRow>
              </>
            ) : null}
            {error ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={5}>
                  {error.message}
                </TableCell>
              </TableRow>
            ) : null}
            {!isPending && !error && schools.length === 0 ? (
              <TableRow>
                <TableCell className="text-muted-foreground" colSpan={5}>
                  No schools found.
                </TableCell>
              </TableRow>
            ) : null}
            {schools.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Link className="font-medium underline-offset-4 hover:underline" href={`/schools/${item.id}`}>
                    {item.schoolName}
                  </Link>
                </TableCell>
                <TableCell>{item.principalName}</TableCell>
                <TableCell>{item.tanNo}</TableCell>
                <TableCell>{item.loginEmail ?? "Not assigned"}</TableCell>
                <TableCell>
                  <SchoolStatusBadge
                    isBanned={item.isBanned}
                    userId={item.userId}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
