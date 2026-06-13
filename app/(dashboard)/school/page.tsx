"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentSchoolQuery } from "@/lib/schools/api";

export default function SchoolPage() {
  const { data, error, isPending } = useQuery({
    queryKey: ["school", "current"],
    queryFn: getCurrentSchoolQuery,
  });
  const school = data?.school;

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="font-display text-2xl font-bold">
                  {school?.schoolName ?? "School Profile"}
                </CardTitle>
                <CardDescription>
                  Read-only profile for the assigned school
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="flex h-2 w-2 rounded-full bg-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Signed in as this school
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-16 md:col-span-2" />
                <Skeleton className="h-12" />
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-muted-foreground">
                {error.message}
              </p>
            ) : null}
            {school ? (
              <div className="grid gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Principal
                    </span>
                    <p className="mt-1 text-sm">{school.principalName}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      TAN No.
                    </span>
                    <p className="mt-1 font-mono text-sm">{school.tanNo}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Login Email
                    </span>
                    <p className="mt-1 font-mono text-sm">{school.loginEmail}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </span>
                    <p className="mt-1 text-sm">
                      {school.isBanned ? "Inactive" : "Active"}
                    </p>
                  </div>
                </div>
                <Separator className="md:col-span-2" />
                <div className="md:col-span-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Address
                  </span>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{school.address}</p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
