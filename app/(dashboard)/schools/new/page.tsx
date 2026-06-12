"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { SchoolForm } from "@/components/schools/school-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
    <Card>
      <CardHeader>
        <CardTitle>Add School</CardTitle>
        <CardDescription>
          Create the school profile first. Login credentials can be assigned on
          the next screen.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
  );
}
