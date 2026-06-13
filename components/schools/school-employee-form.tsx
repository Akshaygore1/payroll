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
import { Separator } from "@/components/ui/separator";
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
    const values: SchoolEmployeeValues = {
      fullName: String(formData.get("fullName") ?? ""),
      designation: String(formData.get("designation") ?? ""),
      panNumber: String(formData.get("panNumber") ?? ""),
      gpfNumber: String(formData.get("gpfNumber") ?? ""),
      pfNumber: String(formData.get("pfNumber") ?? ""),
      npsAccountNumber: String(formData.get("npsAccountNumber") ?? ""),
      whatsappNumber: String(formData.get("whatsappNumber") ?? ""),
      contactNumber: String(formData.get("contactNumber") ?? ""),
    };

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
    <form className="flex flex-col gap-8" onSubmit={handleSubmit}>
      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Identity
        </h3>
        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
          <EmployeeField
            defaultValue={defaultValues.fullName}
            error={state.fieldErrors?.fullName}
            label="Full Name"
            name="fullName"
            options={{ autoComplete: "name" }}
          />
          <EmployeeField
            defaultValue={defaultValues.designation}
            error={state.fieldErrors?.designation}
            label="Designation"
            name="designation"
            options={{ autoComplete: "organization-title" }}
          />
        </FieldGroup>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Fund Details
        </h3>
        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
          <EmployeeField
            defaultValue={defaultValues.panNumber}
            error={state.fieldErrors?.panNumber}
            label="PAN Number"
            name="panNumber"
            options={{ mono: true }}
          />
          <EmployeeField
            defaultValue={defaultValues.gpfNumber}
            error={state.fieldErrors?.gpfNumber}
            label="GPF Number"
            name="gpfNumber"
            options={{ mono: true }}
          />
          <EmployeeField
            defaultValue={defaultValues.pfNumber}
            error={state.fieldErrors?.pfNumber}
            label="PF Number"
            name="pfNumber"
            options={{ mono: true }}
          />
          <EmployeeField
            defaultValue={defaultValues.npsAccountNumber}
            error={state.fieldErrors?.npsAccountNumber}
            label="NPS Account Number"
            name="npsAccountNumber"
            options={{ mono: true }}
          />
        </FieldGroup>
      </div>

      <Separator />

      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Contact
        </h3>
        <FieldGroup className="gap-5 sm:grid sm:grid-cols-2">
          <EmployeeField
            defaultValue={defaultValues.whatsappNumber}
            error={state.fieldErrors?.whatsappNumber}
            label="WhatsApp Number"
            name="whatsappNumber"
            options={{ autoComplete: "tel", mono: true }}
          />
          <EmployeeField
            defaultValue={defaultValues.contactNumber}
            error={state.fieldErrors?.contactNumber}
            label="Contact Number"
            name="contactNumber"
            options={{ autoComplete: "tel", mono: true }}
          />
        </FieldGroup>
      </div>

      <Separator />

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

type EmployeeFieldProps = {
  defaultValue: string;
  error?: string;
  label: string;
  name: SchoolEmployeeField;
  options?: { autoComplete?: string; mono?: boolean };
};

function EmployeeField({
  defaultValue,
  error,
  label,
  name,
  options,
}: EmployeeFieldProps) {
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        aria-invalid={error ? true : undefined}
        autoComplete={options?.autoComplete}
        className={options?.mono ? "font-mono" : undefined}
        defaultValue={defaultValue}
        id={name}
        name={name}
        required
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}
