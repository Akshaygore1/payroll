"use client";

import { useState } from "react";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  type SchoolEmployeeField,
  type SchoolEmployeeValues,
  type SchoolMutationResult,
} from "@/lib/schools/api";

type SchoolEmployeeFormProps = {
  defaultValues: SchoolEmployeeValues;
  onCancel: () => void;
  onSubmit: (
    values: SchoolEmployeeValues,
  ) => Promise<SchoolMutationResult<SchoolEmployeeField>>;
  pendingLabel: string;
  submitLabel: string;
};

const fields: Array<{
  name: SchoolEmployeeField;
  label: string;
  autoComplete?: string;
}> = [
  { name: "fullName", label: "Full Name", autoComplete: "name" },
  { name: "designation", label: "Designation", autoComplete: "organization-title" },
  { name: "panNumber", label: "PAN Number" },
  { name: "gpfNumber", label: "GPF Number" },
  { name: "pfNumber", label: "PF Number" },
  { name: "npsAccountNumber", label: "NPS Account Number" },
  { name: "whatsappNumber", label: "WhatsApp Number", autoComplete: "tel" },
  { name: "contactNumber", label: "Contact Number", autoComplete: "tel" },
];

const initialState: SchoolMutationResult<SchoolEmployeeField> = {};

export function SchoolEmployeeForm({
  defaultValues,
  onCancel,
  onSubmit,
  pendingLabel,
  submitLabel,
}: SchoolEmployeeFormProps) {
  const [state, setState] =
    useState<SchoolMutationResult<SchoolEmployeeField>>(initialState);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const values = fields.reduce((accumulator, field) => {
      accumulator[field.name] = String(formData.get(field.name) ?? "");
      return accumulator;
    }, {} as SchoolEmployeeValues);

    try {
      const result = await onSubmit(values);
      setState(result);
    } catch (error) {
      if (error instanceof ApiError) {
        setState({
          status: "error",
          message: error.message,
          fieldErrors: error.fieldErrors,
        });
      } else {
        setState({
          status: "error",
          message: "Unable to save employee.",
        });
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
        {fields.map((field) => (
          <Field
            data-invalid={state.fieldErrors?.[field.name] ? true : undefined}
            key={field.name}
          >
            <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
            <Input
              aria-invalid={state.fieldErrors?.[field.name] ? true : undefined}
              autoComplete={field.autoComplete}
              defaultValue={defaultValues[field.name]}
              id={field.name}
              name={field.name}
              required
            />
            <FieldError>{state.fieldErrors?.[field.name]}</FieldError>
          </Field>
        ))}
      </FieldGroup>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-sm text-muted-foreground">
          {state.message ?? ""}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button disabled={isPending} onClick={onCancel} type="button" variant="outline">
            Cancel
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
