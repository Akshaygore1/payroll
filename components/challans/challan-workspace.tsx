"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getPayrollContextQuery } from "@/lib/payroll/api";
import { ApiError, listSchoolsQuery } from "@/lib/schools/api";

function buildExportUrl(schoolId: string, financialYear: string) {
  const searchParams = new URLSearchParams({
    schoolId,
    financialYear,
  });

  return `/api/challans/export?${searchParams.toString()}`;
}

function parseFilename(contentDisposition: string | null) {
  const match = /filename="([^"]+)"/.exec(contentDisposition ?? "");
  return match?.[1] ?? "challans.xlsx";
}

async function downloadChallanWorkbook(schoolId: string, financialYear: string) {
  const response = await fetch(buildExportUrl(schoolId, financialYear));

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({}))) as Record<string, string | undefined>;
    throw new ApiError(response.status, body);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = parseFilename(response.headers.get("content-disposition"));
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
}

function ChallanWorkspaceLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28" />
      <Skeleton className="h-48" />
    </div>
  );
}

function ChallanWorkspaceError({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Unable to load challans workspace</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function ChallanWorkspace() {
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState("");

  const schoolsQuery = useQuery({
    queryKey: ["schools"],
    queryFn: listSchoolsQuery,
  });

  const payrollContextQuery = useQuery({
    queryKey: ["challan-context", selectedSchoolId],
    queryFn: () => getPayrollContextQuery(selectedSchoolId),
    enabled: selectedSchoolId.length > 0,
  });

  const downloadMutation = useMutation({
    mutationFn: async () =>
      downloadChallanWorkbook(selectedSchoolId, selectedFinancialYear),
  });

  if (schoolsQuery.isPending) {
    return <ChallanWorkspaceLoading />;
  }

  if (schoolsQuery.error) {
    return <ChallanWorkspaceError message={schoolsQuery.error.message} />;
  }

  const schools = schoolsQuery.data?.schools ?? [];
  const financialYears = payrollContextQuery.data?.financialYears ?? [];
  const canDownload =
    selectedSchoolId.length > 0 &&
    selectedFinancialYear.length > 0 &&
    !downloadMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Challans"
        description="Choose a school and financial year, then export the monthly challan workbook."
      />

      <Card>
        <CardHeader>
          <CardTitle>Select School</CardTitle>
          <CardDescription>
            Choose the school whose challan workbook you want to download.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field className="max-w-sm">
            <FieldLabel htmlFor="challan-school">School</FieldLabel>
            <Select
              onValueChange={(value) => {
                setSelectedSchoolId(value);
                setSelectedFinancialYear("");
              }}
              value={selectedSchoolId}
            >
              <SelectTrigger aria-label="School" id="challan-school">
                <SelectValue placeholder="Select a school" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {schools.map((school) => (
                    <SelectItem key={school.id} value={school.id}>
                      {school.schoolName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <div className="text-sm text-muted-foreground">{schools.length} schools</div>
        </CardContent>
      </Card>

      {!selectedSchoolId ? (
        <Card>
          <CardHeader>
            <CardTitle>Challan Export</CardTitle>
            <CardDescription>
              Select a school first, then choose a financial year to download the workbook.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : payrollContextQuery.isPending ? (
        <ChallanWorkspaceLoading />
      ) : payrollContextQuery.error ? (
        <ChallanWorkspaceError message={payrollContextQuery.error.message} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{payrollContextQuery.data?.school.schoolName}</CardTitle>
            <CardDescription>
              Export both challan sheets for the selected financial year.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FieldGroup className="max-w-sm">
              <Field>
                <FieldLabel htmlFor="challan-financial-year">
                  Financial Year
                </FieldLabel>
                <Select
                  onValueChange={setSelectedFinancialYear}
                  value={selectedFinancialYear}
                >
                  <SelectTrigger
                    aria-label="Financial Year"
                    id="challan-financial-year"
                  >
                    <SelectValue placeholder="Select a financial year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {financialYears.map((financialYear) => (
                        <SelectItem key={financialYear} value={financialYear}>
                          {financialYear}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <Button
              disabled={!canDownload}
              onClick={() => downloadMutation.mutate()}
              type="button"
            >
              {downloadMutation.isPending ? "Downloading..." : "Download"}
            </Button>

            {downloadMutation.error ? (
              <div className="text-sm text-destructive">
                {downloadMutation.error.message}
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
