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
      <PageHeader
        title="Add School"
        description="Step 1 of 2: create the school profile. Login credentials can be assigned after save."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/schools">Back to Schools</Link>
          </Button>
        }
      />
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
  );
}
