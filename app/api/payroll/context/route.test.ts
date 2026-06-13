import { beforeEach, describe, expect, it, vi } from "vitest";

function assertResponse(response: Response | undefined): Response {
  expect(response).toBeDefined();
  return response as Response;
}

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getSchoolIdForUser: vi.fn(),
  getPayrollSchoolById: vi.fn(),
  getPayrollSettings: vi.fn(),
  listPayrollEmployees: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/schools/employees", () => ({
  getSchoolIdForUser: mocks.getSchoolIdForUser,
}));

vi.mock("@/lib/payroll/data", () => ({
  getPayrollSchoolById: mocks.getPayrollSchoolById,
  getPayrollSettings: mocks.getPayrollSettings,
  listPayrollEmployees: mocks.listPayrollEmployees,
}));

describe("/api/payroll/context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: {
        id: "school-user-1",
        role: "school",
      },
    });
    mocks.getSchoolIdForUser.mockResolvedValue("school-1");
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
    mocks.listPayrollEmployees.mockResolvedValue([
      {
        id: "employee-1",
        fullName: "Anita Sharma",
        designation: "Teacher",
        panNumber: "ABCDE1234F",
        gpfNumber: "GPF-1",
        pfNumber: "PF-1",
        npsAccountNumber: "NPS-1",
        contactNumber: "9999999999",
      },
    ]);
  });

  it("returns payroll context for the current school user", async () => {
    const { GET } = await import("./route");
    const response = assertResponse(
      await GET(new Request("http://localhost/api/payroll/context")),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getSchoolIdForUser).toHaveBeenCalledWith("school-user-1");
    expect(body.school.schoolName).toBe("Alpha School");
    expect(body.settings.statementStartMonth).toBe(4);
    expect(body.employees).toHaveLength(1);
    expect(body.financialYears).toHaveLength(8);
  });

  it("rejects school access for another school", async () => {
    const { GET } = await import("./route");
    const response = assertResponse(
      await GET(
        new Request("http://localhost/api/payroll/context?schoolId=school-2"),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("requires school selection for admins", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "admin",
      },
    });

    const { GET } = await import("./route");
    const response = assertResponse(
      await GET(new Request("http://localhost/api/payroll/context")),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "School selection is required." });
  });
});
