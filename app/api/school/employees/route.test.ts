import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    createSchoolEmployee: vi.fn(),
    getSchoolIdForUser: vi.fn(),
    getSession: vi.fn(),
    listSchoolEmployees: vi.fn(),
  };
});

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/schools/employees", () => ({
  createSchoolEmployee: mocks.createSchoolEmployee,
  getSchoolIdForUser: mocks.getSchoolIdForUser,
  listSchoolEmployees: mocks.listSchoolEmployees,
}));

const validEmployeeValues = {
  fullName: "Anita Sharma",
  designation: "Teacher",
  panNumber: "abcde1234f",
  gpfNumber: "GPF-1",
  pfNumber: "PF-1",
  npsAccountNumber: "NPS-1",
  whatsappNumber: "9999999999",
  contactNumber: "8888888888",
};

const employeeRecord = {
  id: "employee-1",
  schoolId: "school-1",
  ...validEmployeeValues,
  panNumber: "ABCDE1234F",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("/api/school/employees", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: {
        id: "school-user-1",
        role: "school",
      },
    });
    mocks.getSchoolIdForUser.mockResolvedValue("school-1");
  });

  it("requires a school session", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "admin",
      },
    });

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mocks.listSchoolEmployees).not.toHaveBeenCalled();
  });

  it("lists employees for the current school", async () => {
    mocks.listSchoolEmployees.mockResolvedValue([employeeRecord]);

    const { GET } = await import("./route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.getSchoolIdForUser).toHaveBeenCalledWith("school-user-1");
    expect(mocks.listSchoolEmployees).toHaveBeenCalledWith("school-1");
    expect(body).toEqual({
      employees: [
        {
          ...employeeRecord,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    });
  });

  it("returns validation errors for invalid create requests", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/school/employees", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      status: "error",
      message: "Fix the highlighted fields.",
      fieldErrors: {
        fullName: "Invalid input: expected string, received undefined",
        designation: "Invalid input: expected string, received undefined",
        panNumber: "Invalid input: expected string, received undefined",
        gpfNumber: "Invalid input: expected string, received undefined",
        pfNumber: "Invalid input: expected string, received undefined",
        npsAccountNumber: "Invalid input: expected string, received undefined",
        whatsappNumber: "Invalid input: expected string, received undefined",
        contactNumber: "Invalid input: expected string, received undefined",
      },
    });
    expect(mocks.createSchoolEmployee).not.toHaveBeenCalled();
  });

  it("creates an employee for the current school", async () => {
    mocks.createSchoolEmployee.mockResolvedValue(employeeRecord);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/school/employees", {
        method: "POST",
        body: JSON.stringify(validEmployeeValues),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mocks.createSchoolEmployee).toHaveBeenCalledWith("school-1", {
      ...validEmployeeValues,
      panNumber: "ABCDE1234F",
    });
    expect(body).toEqual({
      status: "success",
      message: "Employee created.",
      employee: {
        ...employeeRecord,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    });
  });
});
