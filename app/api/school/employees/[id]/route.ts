import {
  deleteCurrentSchoolEmployee,
  readJsonBody,
  requireApiRole,
  updateCurrentSchoolEmployee,
} from "@/lib/schools/server";
import type { SchoolEmployeeValues } from "@/lib/schools/api";

type EmployeeRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: EmployeeRouteContext,
) {
  const auth = await requireApiRole("school");

  if ("response" in auth) {
    return auth.response;
  }

  const [{ id }, body] = await Promise.all([
    params,
    readJsonBody<SchoolEmployeeValues>(request),
  ]);

  return updateCurrentSchoolEmployee(auth.session.user.id, id, body);
}

export async function DELETE(
  _request: Request,
  { params }: EmployeeRouteContext,
) {
  const auth = await requireApiRole("school");

  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await params;

  return deleteCurrentSchoolEmployee(auth.session.user.id, id);
}
