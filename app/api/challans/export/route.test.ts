import { beforeEach, describe, expect, it, vi } from "vitest";

function assertResponse(response: Response | undefined): Response {
  expect(response).toBeDefined();
  return response as Response;
}

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getPayrollSchoolById: vi.fn(),
  getPayrollSettings: vi.fn(),
  listPayrollEmployees: vi.fn(),
  listSchoolPayrollLedgerForFinancialYear: vi.fn(),
  createChallanWorkbookBuffer: vi.fn(),
  buildChallanFileName: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/payroll/data", () => ({
  getPayrollSchoolById: mocks.getPayrollSchoolById,
  getPayrollSettings: mocks.getPayrollSettings,
  listPayrollEmployees: mocks.listPayrollEmployees,
  listSchoolPayrollLedgerForFinancialYear:
    mocks.listSchoolPayrollLedgerForFinancialYear,
}));

vi.mock("@/lib/challans/export", () => ({
  createChallanWorkbookBuffer: mocks.createChallanWorkbookBuffer,
  buildChallanFileName: mocks.buildChallanFileName,
}));

describe("/api/challans/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "admin",
      },
    });
    mocks.getPayrollSchoolById.mockResolvedValue({
      id: "school-1",
      schoolName: "Alpha School",
      principalName: "Jane Doe",
      address: "Main Road",
      tanNo: "TAN123",
    });
    mocks.getPayrollSettings.mockResolvedValue({
      id: "settings-1",
      schoolId: "school-1",
      statementStartMonth: 4,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    mocks.listPayrollEmployees.mockResolvedValue([]);
    mocks.listSchoolPayrollLedgerForFinancialYear.mockResolvedValue([]);
    mocks.createChallanWorkbookBuffer.mockResolvedValue(
      Buffer.from("xlsx-binary"),
    );
    mocks.buildChallanFileName.mockReturnValue("alpha-school-2024-25-challans.xlsx");
  });

  it("rejects requests without a session", async () => {
    mocks.getSession.mockResolvedValue(null);

    const { GET } = await import("./route");
    const response = assertResponse(
      await GET(
        new Request(
          "http://localhost/api/challans/export?schoolId=school-1&financialYear=2024-25",
        ),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("rejects non-admin users", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "school-user-1",
        role: "school",
      },
    });

    const { GET } = await import("./route");
    const response = assertResponse(
      await GET(
        new Request(
          "http://localhost/api/challans/export?schoolId=school-1&financialYear=2024-25",
        ),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("requires schoolId and financialYear query parameters", async () => {
    const { GET } = await import("./route");

    const missingSchoolResponse = assertResponse(
      await GET(
        new Request(
          "http://localhost/api/challans/export?financialYear=2024-25",
        ),
      ),
    );
    expect(missingSchoolResponse.status).toBe(400);
    await expect(missingSchoolResponse.json()).resolves.toEqual({
      error: "School selection is required.",
    });

    const missingFinancialYearResponse = assertResponse(
      await GET(
        new Request("http://localhost/api/challans/export?schoolId=school-1"),
      ),
    );
    expect(missingFinancialYearResponse.status).toBe(400);
    await expect(missingFinancialYearResponse.json()).resolves.toEqual({
      error: "Use a financial year like 2023-24.",
    });
  });

  it("returns an xlsx download for a valid admin request", async () => {
    const { GET } = await import("./route");
    const response = assertResponse(
      await GET(
        new Request(
          "http://localhost/api/challans/export?schoolId=school-1&financialYear=2024-25",
        ),
      ),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(response.headers.get("content-disposition")).toContain(
      'filename="alpha-school-2024-25-challans.xlsx"',
    );
    expect(mocks.createChallanWorkbookBuffer).toHaveBeenCalledWith(
      expect.objectContaining({
        financialYear: "2024-25",
        school: expect.objectContaining({ id: "school-1" }),
      }),
    );
  });
});
