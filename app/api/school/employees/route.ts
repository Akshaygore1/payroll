import {
  createCurrentSchoolEmployee,
  listCurrentSchoolEmployees,
  readJsonBody,
  requireApiRole,
} from "@/lib/schools/server";
import type { SchoolEmployeeValues } from "@/lib/schools/api";

export async function GET() {
  const auth = await requireApiRole("school");

  if ("response" in auth) {
    return auth.response;
  }

  return listCurrentSchoolEmployees(auth.session.user.id);
}

export async function POST(request: Request) {
  const auth = await requireApiRole("school");

  if ("response" in auth) {
    return auth.response;
  }

  const body = await readJsonBody<SchoolEmployeeValues>(request);

  return createCurrentSchoolEmployee(auth.session.user.id, body);
}
