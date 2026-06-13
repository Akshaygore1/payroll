"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { SchoolForm } from "@/components/schools/school-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  createSchoolMutation,
  type SchoolFormValues,
} from "@/lib/schools/api";

export default function NewSchoolPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: (values: SchoolFormValues) => createSchoolMutation(values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["schools"] });
      router.push(`/schools/${result.school.id}`);
    },
  });

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest text-accent">
          <span className="flex h-6 w-6 items-center justify-center border border-accent bg-accent text-accent-foreground text-xs font-bold">
            1
          </span>
          <span>Step 1 of 2: Create School Profile</span>
        </div>
        <PageHeader
          title="Add School"
          description="Create the school profile first. Login credentials can be assigned after saving."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/schools">Back to Schools</Link>
            </Button>
          }
        />
      </div>
      <div className="animate-fade-in-up-delay-1">
        <Card>
          <CardContent className="pt-6">
            <SchoolForm
              onSubmit={createMutation.mutateAsync}
              defaultValues={{
                schoolName: "",
                principalName: "",
                address: "",
                tanNo: "",
              }}
              pendingLabel="Creating"
              submitLabel="Create School"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
