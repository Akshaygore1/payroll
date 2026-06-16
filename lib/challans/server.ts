import {
  buildChallanFileName,
  createChallanWorkbookBuffer,
} from "@/lib/challans/export";
import { parseFinancialYearLabel } from "@/lib/payroll/core";
import {
  getPayrollSchoolById,
  getPayrollSettings,
  listPayrollEmployees,
  listSchoolPayrollLedgerForFinancialYear,
} from "@/lib/payroll/data";
import { jsonResponse, requireApiRole } from "@/lib/schools/server";

export async function exportChallanWorkbook(
  schoolId: string | null,
  financialYear: string | null,
) {
  const auth = await requireApiRole("admin");

  if ("response" in auth) {
    return auth.response;
  }

  if (!schoolId?.trim()) {
    return jsonResponse(
      { error: "School selection is required." },
      { status: 400 },
    );
  }

  if (!financialYear?.trim() || !parseFinancialYearLabel(financialYear)) {
    return jsonResponse(
      { error: "Use a financial year like 2023-24." },
      { status: 400 },
    );
  }

  const [school, settings, employees, ledgerRows] = await Promise.all([
    getPayrollSchoolById(schoolId),
    getPayrollSettings(schoolId),
    listPayrollEmployees(schoolId),
    listSchoolPayrollLedgerForFinancialYear(
      schoolId,
      financialYear,
    ),
  ]);

  if (!school) {
    return jsonResponse({ error: "School not found." }, { status: 404 });
  }

  const buffer = await createChallanWorkbookBuffer({
    school,
      settings,
      employees,
      ledgerRows,
      financialYear,
    });
  const fileName = buildChallanFileName(school.schoolName, financialYear);

  return new Response(buffer, {
    status: 200,
    headers: {
      "cache-control": "no-store",
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${fileName}"`,
    },
  });
}
