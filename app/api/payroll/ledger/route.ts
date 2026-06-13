import {
  getPayrollLedger,
  savePayrollLedgerForSchool,
} from "@/lib/payroll/server";
import { readJsonBody } from "@/lib/schools/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return getPayrollLedger(
    searchParams.get("schoolId"),
    searchParams.get("employeeId"),
    searchParams.get("financialYear"),
  );
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const body = await readJsonBody(request);

  return savePayrollLedgerForSchool(searchParams.get("schoolId"), body);
}
