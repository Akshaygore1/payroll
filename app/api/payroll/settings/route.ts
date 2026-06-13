import { updatePayrollSettings } from "@/lib/payroll/server";
import { readJsonBody } from "@/lib/schools/server";

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const body = await readJsonBody(request);

  return updatePayrollSettings(searchParams.get("schoolId"), body);
}
