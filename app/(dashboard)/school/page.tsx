"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentSchoolQuery } from "@/lib/schools/api";

export default function SchoolPage() {
  const { data, error, isPending } = useQuery({
    queryKey: ["school", "current"],
    queryFn: getCurrentSchoolQuery,
  });
  const school = data?.school;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{school?.schoolName ?? "School Profile"}</CardTitle>
        <CardDescription>
          Read-only school profile for the assigned school account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        {isPending ? (
          <>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-16 md:col-span-2" />
            <Skeleton className="h-12" />
          </>
        ) : null}
        {error ? (
          <p className="text-sm text-muted-foreground md:col-span-2">
            {error.message}
          </p>
        ) : null}
        {school ? (
          <>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Principal Name
          </span>
          <span className="text-sm">{school.principalName}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            TAN No.
          </span>
          <span className="text-sm">{school.tanNo}</span>
        </div>
        <div className="flex flex-col gap-1 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Address
          </span>
          <span className="text-sm">{school.address}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Login Email
          </span>
          <span className="text-sm">{school.loginEmail}</span>
        </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
