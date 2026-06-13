"use client";

import { useState } from "react";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  type SchoolFormField,
  type SchoolFormValues,
  type SchoolMutationResult,
} from "@/lib/schools/api";

type SchoolFormProps = {
  onSubmit: (
    values: SchoolFormValues,
  ) => Promise<SchoolMutationResult<SchoolFormField>>;
  submitLabel: string;
  pendingLabel: string;
  defaultValues: SchoolFormValues;
};

const initialState: SchoolMutationResult<SchoolFormField> = {};

export function SchoolForm({
  onSubmit,
  submitLabel,
  pendingLabel,
  defaultValues,
}: SchoolFormProps) {
  const [state, setState] =
    useState<SchoolMutationResult<SchoolFormField>>(initialState);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const values: SchoolFormValues = {
      schoolName: String(formData.get("schoolName") ?? ""),
      principalName: String(formData.get("principalName") ?? ""),
      address: String(formData.get("address") ?? ""),
      tanNo: String(formData.get("tanNo") ?? ""),
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
          message: "Unable to save school.",
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
          School Details
        </h3>
        <FieldGroup>
          <Field data-invalid={state.fieldErrors?.schoolName ? true : undefined}>
            <FieldLabel htmlFor="schoolName">School Name</FieldLabel>
            <Input
              aria-invalid={state.fieldErrors?.schoolName ? true : undefined}
              defaultValue={defaultValues.schoolName}
              id="schoolName"
              name="schoolName"
              required
            />
            <FieldError>{state.fieldErrors?.schoolName}</FieldError>
          </Field>
          <Field data-invalid={state.fieldErrors?.tanNo ? true : undefined}>
            <FieldLabel htmlFor="tanNo">TAN No.</FieldLabel>
            <Input
              aria-invalid={state.fieldErrors?.tanNo ? true : undefined}
              className="font-mono"
              defaultValue={defaultValues.tanNo}
              id="tanNo"
              name="tanNo"
              required
            />
            <FieldError>{state.fieldErrors?.tanNo}</FieldError>
          </Field>
        </FieldGroup>
      </div>

      <div>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Administrative Details
        </h3>
        <FieldGroup>
          <Field data-invalid={state.fieldErrors?.principalName ? true : undefined}>
            <FieldLabel htmlFor="principalName">Principal Name</FieldLabel>
            <Input
              aria-invalid={state.fieldErrors?.principalName ? true : undefined}
              defaultValue={defaultValues.principalName}
              id="principalName"
              name="principalName"
              required
            />
            <FieldError>{state.fieldErrors?.principalName}</FieldError>
          </Field>
          <Field data-invalid={state.fieldErrors?.address ? true : undefined}>
            <FieldLabel htmlFor="address">Address</FieldLabel>
            <Textarea
              aria-invalid={state.fieldErrors?.address ? true : undefined}
              defaultValue={defaultValues.address}
              id="address"
              name="address"
              required
              rows={4}
            />
            <FieldError>{state.fieldErrors?.address}</FieldError>
          </Field>
        </FieldGroup>
      </div>

      <div className="flex items-center justify-between gap-4 border-t pt-4">
        <p className="text-sm text-muted-foreground">{state.message ?? ""}</p>
        <Button disabled={isPending} type="submit">
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
