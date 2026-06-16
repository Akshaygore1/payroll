import { exportChallanWorkbook } from "@/lib/challans/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return exportChallanWorkbook(
    searchParams.get("schoolId"),
    searchParams.get("financialYear"),
  );
}
