import { beforeEach, describe, expect, it, vi } from "vitest";

function assertResponse(response: Response | undefined): Response {
  expect(response).toBeDefined();
  return response as Response;
}

const mocks = vi.hoisted(() => {
  return {
    getSession: vi.fn(),
    getDb: vi.fn(),
    listSchools: vi.fn(),
  };
});

vi.mock("@/lib/auth/session", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/db", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/schools", () => ({
  listSchools: mocks.listSchools,
}));

describe("/api/schools", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "admin",
      },
    });
  });

  it("returns validation errors for invalid create requests", async () => {
    const { POST } = await import("./route");

    const response = assertResponse(
      await POST(
        new Request("http://localhost/api/schools", {
          method: "POST",
          body: JSON.stringify({}),
        }),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      status: "error",
      message: "Fix the highlighted fields.",
      fieldErrors: {
        schoolName: "Invalid input: expected string, received undefined",
        principalName: "Invalid input: expected string, received undefined",
        address: "Invalid input: expected string, received undefined",
        tanNo: "Invalid input: expected string, received undefined",
      },
    });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("returns a TAN error for unique constraint violations", async () => {
    const returning = vi.fn().mockRejectedValue({ code: "23505" });
    const values = vi.fn(() => ({ returning }));
    const insert = vi.fn(() => ({ values }));

    mocks.getDb.mockReturnValue({ insert });

    const { POST } = await import("./route");
    const response = assertResponse(
      await POST(
        new Request("http://localhost/api/schools", {
          method: "POST",
          body: JSON.stringify({
            schoolName: "Alpha School",
            principalName: "Jane Doe",
            address: "123 Road",
            tanNo: "tan-1",
          }),
        }),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body).toEqual({
      status: "error",
      message: "A school with this TAN No. already exists.",
      fieldErrors: {
        tanNo: "TAN No. must be unique.",
      },
    });
    expect(insert).toHaveBeenCalledOnce();
  });

  it("returns the created school id after a successful create", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: "school-123" }]);
    const values = vi.fn(() => ({ returning }));
    const insert = vi.fn(() => ({ values }));

    mocks.getDb.mockReturnValue({ insert });

    const { POST } = await import("./route");
    const response = assertResponse(
      await POST(
        new Request("http://localhost/api/schools", {
          method: "POST",
          body: JSON.stringify({
            schoolName: "Alpha School",
            principalName: "Jane Doe",
            address: "123 Road",
            tanNo: "tan-1",
          }),
        }),
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body).toEqual({
      status: "success",
      message: "School created.",
      school: {
        id: "school-123",
      },
    });
  });

  it("requires an admin session", async () => {
    mocks.getSession.mockResolvedValue({
      user: {
        id: "school-user-1",
        role: "school",
      },
    });

    const { GET } = await import("./route");
    const response = assertResponse(await GET());
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });
});
