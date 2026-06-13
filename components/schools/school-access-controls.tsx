"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ApiError,
  type SchoolMutationResult,
  type SchoolPasswordValues,
} from "@/lib/schools/api";

type SchoolAccessControlsProps = {
  isActive: boolean;
  onResetPassword: (
    values: SchoolPasswordValues,
  ) => Promise<SchoolMutationResult<"password">>;
  onSetActive: (active: boolean) => Promise<SchoolMutationResult>;
};

const initialState: SchoolMutationResult<"password"> = {};

export function SchoolAccessControls({
  isActive,
  onResetPassword,
  onSetActive,
}: SchoolAccessControlsProps) {
  const [state, setState] =
    useState<SchoolMutationResult<"password">>(initialState);
  const [isResetting, setIsResetting] = useState(false);
  const [isChangingAccess, setIsChangingAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");

  async function handlePasswordReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsResetting(true);

    const formData = new FormData(event.currentTarget);

    try {
      const result = await onResetPassword({
        password: String(formData.get("password") ?? ""),
      });
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
          message: "Unable to reset password.",
        });
      }
    } finally {
      setIsResetting(false);
    }
  }

  async function handleAccessChange(active: boolean) {
    setIsChangingAccess(true);
    setAccessMessage("");

    try {
      const result = await onSetActive(active);
      setAccessMessage(result.message ?? "");
    } catch (error) {
      if (error instanceof ApiError) {
        setAccessMessage(error.message);
      } else {
        setAccessMessage("Unable to update access.");
      }
    } finally {
      setIsChangingAccess(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form className="flex flex-col gap-6" onSubmit={handlePasswordReset}>
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Reset Password
        </h4>
        <FieldGroup>
          <Field data-invalid={state.fieldErrors?.password ? true : undefined}>
            <FieldLabel htmlFor="resetPassword">New Password</FieldLabel>
            <Input
              aria-invalid={state.fieldErrors?.password ? true : undefined}
              autoComplete="new-password"
              id="resetPassword"
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
          <Button disabled={isResetting} type="submit" variant="outline">
            {isResetting ? "Resetting" : "Reset Password"}
          </Button>
        </div>
      </form>

      <Separator />

      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Access State
        </h4>
        <p className="text-sm text-muted-foreground">
          Currently {isActive ? "active" : "inactive"}.{" "}
          {isActive
            ? "Deactivating blocks sign-in until an admin reactivates."
            : "Reactivate to restore sign-in access."}
        </p>

        {accessMessage ? (
          <p className="text-sm text-muted-foreground">{accessMessage}</p>
        ) : null}

        {isActive ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                Deactivate Login
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deactivate School Login</AlertDialogTitle>
                <AlertDialogDescription>
                  This will block the school from signing in until an admin
                  reactivates the account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => void handleAccessChange(false)}
                  variant="destructive"
                >
                  {isChangingAccess ? "Deactivating" : "Deactivate"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            disabled={isChangingAccess}
            onClick={() => void handleAccessChange(true)}
            type="button"
          >
            {isChangingAccess ? "Reactivating" : "Reactivate Login"}
          </Button>
        )}
      </div>
    </div>
  );
}
