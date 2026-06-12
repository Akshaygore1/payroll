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
  type SchoolLoginField,
  type SchoolLoginValues,
  type SchoolMutationResult,
} from "@/lib/schools/api";

type SchoolLoginFormProps = {
  onSubmit: (
    values: SchoolLoginValues,
  ) => Promise<SchoolMutationResult<SchoolLoginField>>;
  submitLabel: string;
  pendingLabel: string;
};

const initialState: SchoolMutationResult<SchoolLoginField> = {};

export function SchoolLoginForm({
  onSubmit,
  submitLabel,
  pendingLabel,
}: SchoolLoginFormProps) {
  const [state, setState] =
    useState<SchoolMutationResult<SchoolLoginField>>(initialState);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    const values: SchoolLoginValues = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const result = await onSubmit(values);
      setState(result);
      event.currentTarget.reset();
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
          message: "Unable to create school login.",
        });
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup>
        <Field data-invalid={state.fieldErrors?.email ? true : undefined}>
          <FieldLabel htmlFor="email">Login Email</FieldLabel>
          <Input
            aria-invalid={state.fieldErrors?.email ? true : undefined}
            autoComplete="email"
            id="email"
            name="email"
            required
            type="email"
          />
          <FieldError>{state.fieldErrors?.email}</FieldError>
        </Field>
        <Field data-invalid={state.fieldErrors?.password ? true : undefined}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            aria-invalid={state.fieldErrors?.password ? true : undefined}
            autoComplete="new-password"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
          <FieldError>{state.fieldErrors?.password}</FieldError>
        </Field>
      </FieldGroup>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{state.message ?? ""}</p>
        <Button disabled={isPending} type="submit">
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
