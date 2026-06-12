import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    deleteSchoolEmployee: vi.fn(),
    getSchoolIdForUser: vi.fn(),
    getSession: vi.fn(),
    updateSchoolEmployee: vi.fn(),
  };
});

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/schools/employees", () => ({
  deleteSchoolEmployee: mocks.deleteSchoolEmployee,
  getSchoolIdForUser: mocks.getSchoolIdForUser,
  updateSchoolEmployee: mocks.updateSchoolEmployee,
}));

const validEmployeeValues = {
  fullName: "Anita Sharma",
  designation: "Teacher",
  panNumber: "ABCDE1234F",
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
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-02T00:00:00.000Z"),
};

function routeContext(id = "employee-1") {
  return {
    params: Promise.resolve({ id }),
  };
}

describe("/api/school/employees/[id]", () => {
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

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/school/employees/employee-1", {
        method: "DELETE",
      }),
      routeContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
    expect(mocks.deleteSchoolEmployee).not.toHaveBeenCalled();
  });

  it("returns not found when updating an employee outside the current school", async () => {
    mocks.updateSchoolEmployee.mockResolvedValue(null);

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/school/employees/employee-1", {
        method: "PATCH",
        body: JSON.stringify(validEmployeeValues),
      }),
      routeContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(mocks.updateSchoolEmployee).toHaveBeenCalledWith(
      "school-1",
      "employee-1",
      validEmployeeValues,
    );
    expect(body).toEqual({
      status: "error",
      message: "Employee not found.",
    });
  });

  it("updates an employee in the current school", async () => {
    mocks.updateSchoolEmployee.mockResolvedValue(employeeRecord);

    const { PATCH } = await import("./route");
    const response = await PATCH(
      new Request("http://localhost/api/school/employees/employee-1", {
        method: "PATCH",
        body: JSON.stringify(validEmployeeValues),
      }),
      routeContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "success",
      message: "Employee updated.",
      employee: {
        ...employeeRecord,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });
  });

  it("returns not found when deleting an employee outside the current school", async () => {
    mocks.deleteSchoolEmployee.mockResolvedValue(null);

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/school/employees/employee-1", {
        method: "DELETE",
      }),
      routeContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(mocks.deleteSchoolEmployee).toHaveBeenCalledWith(
      "school-1",
      "employee-1",
    );
    expect(body).toEqual({
      status: "error",
      message: "Employee not found.",
    });
  });

  it("deletes an employee in the current school", async () => {
    mocks.deleteSchoolEmployee.mockResolvedValue("employee-1");

    const { DELETE } = await import("./route");
    const response = await DELETE(
      new Request("http://localhost/api/school/employees/employee-1", {
        method: "DELETE",
      }),
      routeContext(),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "success",
      message: "Employee deleted.",
    });
  });
});
