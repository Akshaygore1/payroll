import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getSchoolIdForUser: vi.fn(),
  getPayrollSchoolById: vi.fn(),
  getPayrollSettings: vi.fn(),
  getPayrollEmployeeById: vi.fn(),
  listPayrollLedger: vi.fn(),
  savePayrollLedger: vi.fn(),
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
  getPayrollEmployeeById: mocks.getPayrollEmployeeById,
  listPayrollLedger: mocks.listPayrollLedger,
  savePayrollLedger: mocks.savePayrollLedger,
}));

describe("/api/payroll/ledger", () => {
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
    mocks.getPayrollEmployeeById.mockResolvedValue({
      id: "employee-1",
      fullName: "Anita Sharma",
      designation: "Teacher",
      panNumber: "ABCDE1234F",
      gpfNumber: "GPF-1",
      pfNumber: "PF-1",
      npsAccountNumber: "NPS-1",
      contactNumber: "9999999999",
    });
  });

  it("rejects invalid financial year queries", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/payroll/ledger?employeeId=employee-1&financialYear=2023",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Use a financial year like 2023-24." });
  });

  it("returns default monthly rows when no payroll has been saved", async () => {
    mocks.listPayrollLedger.mockResolvedValue([]);

    const { GET } = await import("./route");
    const response = await GET(
      new Request(
        "http://localhost/api/payroll/ledger?employeeId=employee-1&financialYear=2023-24",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rows).toHaveLength(12);
    expect(body.rows[0].rowLabel).toBe("Apr-23");
    expect(body.rows[11].rowLabel).toBe("Mar-24");
  });

  it("saves payroll rows for an admin-selected school", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "admin",
      },
    });
    mocks.savePayrollLedger.mockResolvedValue([
      {
        id: "row-1",
        schoolId: "school-1",
        employeeId: "employee-1",
        financialYear: "2023-24",
        rowType: "month",
        rowMonth: 4,
        rowLabel: "Apr-23",
        displayOrder: 0,
        basicPay: 100,
        totalPay: 100,
        da: 10,
        daDifferenceArrears: 0,
        hra: 5,
        cla: 2,
        vaTaArrear: 0,
        totalEarnings: 117,
        recovery: 0,
        grandTotal: 117,
        gpf: 0,
        rd: 0,
        cmFund: 1,
        professionalTax: 2,
        revenueStamp: 0,
        incomeTax: 0,
        lic: 0,
        totalDeduction: 3,
        netSalary: 114,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    const { PUT } = await import("./route");
    const response = await PUT(
      new Request("http://localhost/api/payroll/ledger?schoolId=school-1", {
        method: "PUT",
        body: JSON.stringify({
          employeeId: "employee-1",
          financialYear: "2023-24",
          rows: [
            {
              rowType: "month",
              rowMonth: 4,
              rowLabel: "Apr-23",
              displayOrder: 0,
              basicPay: 100,
              totalPay: 100,
              da: 10,
              daDifferenceArrears: 0,
              hra: 5,
              cla: 2,
              vaTaArrear: 0,
              recovery: 0,
              gpf: 0,
              rd: 0,
              cmFund: 1,
              professionalTax: 2,
              revenueStamp: 0,
              incomeTax: 0,
              lic: 0,
            },
          ],
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.savePayrollLedger).toHaveBeenCalledWith(
      "school-1",
      "employee-1",
      "2023-24",
      [
        expect.objectContaining({
          displayOrder: 0,
          basicPay: 100,
          professionalTax: 2,
        }),
      ],
      "admin-1",
    );
    expect(body.status).toBe("success");
  });
});
