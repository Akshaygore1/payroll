import { getPayrollContext } from "@/lib/payroll/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return getPayrollContext(searchParams.get("schoolId"));
}
