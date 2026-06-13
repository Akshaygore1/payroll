"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";

import { SchoolAccessControls } from "@/components/schools/school-access-controls";
import { SchoolForm } from "@/components/schools/school-form";
import { SchoolLoginForm } from "@/components/schools/school-login-form";
import { SchoolStatusBadge } from "@/components/schools/school-status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createSchoolLoginMutation,
  getSchoolQuery,
  resetSchoolPasswordMutation,
  setSchoolAccessMutation,
  updateSchoolMutation,
  type SchoolFormValues,
  type SchoolLoginValues,
  type SchoolPasswordValues,
} from "@/lib/schools/api";

export default function SchoolDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery({
    queryKey: ["schools", id],
    queryFn: () => getSchoolQuery(id),
    enabled: Boolean(id),
  });
  const school = data?.school;

  const updateMutation = useMutation({
    mutationFn: (values: SchoolFormValues) => updateSchoolMutation(id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["schools"] }),
        queryClient.invalidateQueries({ queryKey: ["schools", id] }),
        queryClient.invalidateQueries({ queryKey: ["school", "current"] }),
      ]);
    },
  });
  const createLoginMutation = useMutation({
    mutationFn: (values: SchoolLoginValues) =>
      createSchoolLoginMutation(id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["schools"] }),
        queryClient.invalidateQueries({ queryKey: ["schools", id] }),
        queryClient.invalidateQueries({ queryKey: ["school", "current"] }),
      ]);
    },
  });
  const resetPasswordMutation = useMutation({
    mutationFn: (values: SchoolPasswordValues) =>
      resetSchoolPasswordMutation(id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["schools"] }),
        queryClient.invalidateQueries({ queryKey: ["schools", id] }),
        queryClient.invalidateQueries({ queryKey: ["school", "current"] }),
      ]);
    },
  });
  const accessMutation = useMutation({
    mutationFn: (active: boolean) => setSchoolAccessMutation(id, active),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["schools"] }),
        queryClient.invalidateQueries({ queryKey: ["schools", id] }),
        queryClient.invalidateQueries({ queryKey: ["school", "current"] }),
      ]);
    },
  });

  if (isPending) {
    return (
      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <Skeleton className="h-96" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error || !school) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>School Not Found</CardTitle>
          <CardDescription>
            {error?.message ?? "Unable to load this school."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isActive = !!school.userId && !school.isBanned;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{school.schoolName}</CardTitle>
          <CardDescription>
            Update the school profile and business identifiers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SchoolForm
            onSubmit={updateMutation.mutateAsync}
            defaultValues={{
              schoolName: school.schoolName,
              principalName: school.principalName,
              address: school.address,
              tanNo: school.tanNo,
            }}
            pendingLabel="Saving"
            submitLabel="Save Changes"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Login Status</CardTitle>
            <CardDescription>
              Track whether the school has an assigned login and whether access
              is active.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Current state</span>
              <SchoolStatusBadge isBanned={school.isBanned} userId={school.userId} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">Login email</span>
              <span className="text-sm font-medium">
                {school.loginEmail ?? "Not assigned"}
              </span>
            </div>
          </CardContent>
        </Card>

        {!school.userId ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Login</CardTitle>
              <CardDescription>
                Assign the first school login after the profile is created.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SchoolLoginForm
                onSubmit={createLoginMutation.mutateAsync}
                pendingLabel="Creating"
                submitLabel="Create Login"
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Access Controls</CardTitle>
              <CardDescription>
                Reset credentials and control sign-in access for this school.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SchoolAccessControls
                isActive={isActive}
                onResetPassword={resetPasswordMutation.mutateAsync}
                onSetActive={accessMutation.mutateAsync}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
