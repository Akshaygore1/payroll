import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { createAuth } from "@/lib/auth/server";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { school } from "@/lib/db/schema";
import {
  createSchoolEmployee,
  deleteSchoolEmployee,
  getSchoolIdForUser,
  listSchoolEmployees,
  updateSchoolEmployee,
} from "@/lib/schools/employees";
import type {
  SchoolEmployeeField,
  SchoolEmployeeValues,
  SchoolFormField,
  SchoolFormValues,
  SchoolLoginField,
  SchoolLoginValues,
  SchoolMutationResult,
  SchoolPasswordValues,
} from "@/lib/schools/api";

export const schoolSchema = z.object({
  schoolName: z.string().trim().min(1, "School name is required."),
  principalName: z.string().trim().min(1, "Principal name is required."),
  address: z.string().trim().min(1, "Address is required."),
  tanNo: z
    .string()
    .trim()
    .min(1, "TAN No. is required.")
    .transform((value) => value.toUpperCase()),
});

export const schoolEmployeeSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required."),
  designation: z.string().trim().min(1, "Designation is required."),
  panNumber: z
    .string()
    .trim()
    .min(1, "PAN number is required.")
    .transform((value) => value.toUpperCase()),
  gpfNumber: z.string().trim().min(1, "GPF number is required."),
  pfNumber: z.string().trim().min(1, "PF number is required."),
  npsAccountNumber: z
    .string()
    .trim()
    .min(1, "NPS account number is required."),
  whatsappNumber: z.string().trim().min(1, "WhatsApp number is required."),
  contactNumber: z.string().trim().min(1, "Contact number is required."),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export function jsonResponse(body: unknown, init: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "cache-control": "no-store",
      ...init.headers,
    },
  });
}

export async function requireApiRole(role: "admin" | "school") {
  const session = await getSession();

  if (!session) {
    return {
      response: jsonResponse({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (session.user.role !== role) {
    return {
      response: jsonResponse({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session };
}

export async function readJsonBody<T = unknown>(request: Request) {
  return (await request.json().catch(() => null)) as T | null;
}

export function getFieldErrors(error: z.ZodError) {
  const flattened = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;

  return Object.fromEntries(
    Object.entries(flattened).map(([key, value]) => [
      key,
      value?.[0] ?? "Invalid value.",
    ]),
  );
}

export function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function validationError<TField extends string>(
  error: z.ZodError,
): SchoolMutationResult<TField> {
  return {
    status: "error",
    message: "Fix the highlighted fields.",
    fieldErrors: getFieldErrors(error) as Partial<Record<TField, string>>,
  };
}

function serializeEmployee<T extends { createdAt: Date; updatedAt: Date }>(
  record: T,
) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function getCurrentSchoolId(userId: string) {
  const schoolId = await getSchoolIdForUser(userId);

  if (!schoolId) {
    return {
      response: jsonResponse({ error: "School not found." }, { status: 404 }),
    };
  }

  return { schoolId };
}

export async function listCurrentSchoolEmployees(userId: string) {
  const currentSchool = await getCurrentSchoolId(userId);

  if ("response" in currentSchool) {
    return currentSchool.response;
  }

  const employees = await listSchoolEmployees(currentSchool.schoolId);

  return jsonResponse(
    { employees: employees.map((employee) => serializeEmployee(employee)) },
    { status: 200 },
  );
}

export async function createCurrentSchoolEmployee(
  userId: string,
  body: SchoolEmployeeValues | null,
) {
  const currentSchool = await getCurrentSchoolId(userId);

  if ("response" in currentSchool) {
    return currentSchool.response;
  }

  const parsed = schoolEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(validationError<SchoolEmployeeField>(parsed.error), {
      status: 400,
    });
  }

  try {
    const employee = await createSchoolEmployee(
      currentSchool.schoolId,
      parsed.data,
    );

    return jsonResponse(
      {
        status: "success",
        message: "Employee created.",
        employee: serializeEmployee(employee),
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        message: getErrorMessage(error, "Unable to create employee."),
      },
      { status: 500 },
    );
  }
}

export async function updateCurrentSchoolEmployee(
  userId: string,
  employeeId: string,
  body: SchoolEmployeeValues | null,
) {
  const currentSchool = await getCurrentSchoolId(userId);

  if ("response" in currentSchool) {
    return currentSchool.response;
  }

  const parsed = schoolEmployeeSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(validationError<SchoolEmployeeField>(parsed.error), {
      status: 400,
    });
  }

  try {
    const employee = await updateSchoolEmployee(
      currentSchool.schoolId,
      employeeId,
      parsed.data,
    );

    if (!employee) {
      return jsonResponse(
        {
          status: "error",
          message: "Employee not found.",
        },
        { status: 404 },
      );
    }

    return jsonResponse(
      {
        status: "success",
        message: "Employee updated.",
        employee: serializeEmployee(employee),
      },
      { status: 200 },
    );
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        message: getErrorMessage(error, "Unable to update employee."),
      },
      { status: 500 },
    );
  }
}

export async function deleteCurrentSchoolEmployee(
  userId: string,
  employeeId: string,
) {
  const currentSchool = await getCurrentSchoolId(userId);

  if ("response" in currentSchool) {
    return currentSchool.response;
  }

  try {
    const deletedId = await deleteSchoolEmployee(
      currentSchool.schoolId,
      employeeId,
    );

    if (!deletedId) {
      return jsonResponse(
        {
          status: "error",
          message: "Employee not found.",
        },
        { status: 404 },
      );
    }

    return jsonResponse(
      {
        status: "success",
        message: "Employee deleted.",
      },
      { status: 200 },
    );
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        message: getErrorMessage(error, "Unable to delete employee."),
      },
      { status: 500 },
    );
  }
}

export async function createSchoolRecord(body: unknown) {
  const parsed = schoolSchema.safeParse(body);

  if (!parsed.success) {
    return {
      response: jsonResponse(validationError<SchoolFormField>(parsed.error), {
        status: 400,
      }),
    };
  }

  try {
    const db = getDb();
    const [createdSchool] = await db
      .insert(school)
      .values({
        id: crypto.randomUUID(),
        ...parsed.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: school.id });

    return {
      response: jsonResponse(
        {
          status: "success",
          message: "School created.",
          school: { id: createdSchool.id },
        },
        { status: 201 },
      ),
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        response: jsonResponse(
          {
            status: "error",
            message: "A school with this TAN No. already exists.",
            fieldErrors: {
              tanNo: "TAN No. must be unique.",
            },
          },
          { status: 409 },
        ),
      };
    }

    return {
      response: jsonResponse(
        {
          status: "error",
          message: getErrorMessage(error, "Unable to create school."),
        },
        { status: 500 },
      ),
    };
  }
}

export async function updateSchoolRecord(
  schoolId: string,
  body: SchoolFormValues | null,
) {
  const parsed = schoolSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(validationError<SchoolFormField>(parsed.error), {
      status: 400,
    });
  }

  try {
    const db = getDb();
    await db
      .update(school)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(school.id, schoolId));

    return jsonResponse(
      {
        status: "success",
        message: "School profile updated.",
      },
      { status: 200 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return jsonResponse(
        {
          status: "error",
          message: "A school with this TAN No. already exists.",
          fieldErrors: {
            tanNo: "TAN No. must be unique.",
          },
        },
        { status: 409 },
      );
    }

    return jsonResponse(
      {
        status: "error",
        message: getErrorMessage(error, "Unable to update school."),
      },
      { status: 500 },
    );
  }
}

export async function createSchoolLoginRecord(
  schoolId: string,
  body: SchoolLoginValues | null,
) {
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(validationError<SchoolLoginField>(parsed.error), {
      status: 400,
    });
  }

  const db = getDb();
  const [record] = await db
    .select({
      id: school.id,
      schoolName: school.schoolName,
      userId: school.userId,
    })
    .from(school)
    .where(eq(school.id, schoolId))
    .limit(1);

  if (!record) {
    return jsonResponse(
      {
        status: "error",
        message: "School not found.",
      },
      { status: 404 },
    );
  }

  if (record.userId) {
    return jsonResponse(
      {
        status: "error",
        message: "School login already exists.",
      },
      { status: 409 },
    );
  }

  try {
    const auth = createAuth();
    const result = await auth.api.createUser({
      headers: await headers(),
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        name: record.schoolName,
        role: "school" as never,
      },
    });

    await db
      .update(school)
      .set({
        userId: result.user.id,
        updatedAt: new Date(),
      })
      .where(eq(school.id, schoolId));

    return jsonResponse(
      {
        status: "success",
        message: "School login created.",
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        message: getErrorMessage(error, "Unable to create school login."),
      },
      { status: 500 },
    );
  }
}

export async function resetSchoolPasswordRecord(
  schoolId: string,
  body: SchoolPasswordValues | null,
) {
  const parsed = passwordSchema.safeParse(body);

  if (!parsed.success) {
    return jsonResponse(validationError<"password">(parsed.error), {
      status: 400,
    });
  }

  const db = getDb();
  const [record] = await db
    .select({ userId: school.userId })
    .from(school)
    .where(eq(school.id, schoolId))
    .limit(1);

  if (!record?.userId) {
    return jsonResponse(
      {
        status: "error",
        message: "School login does not exist yet.",
      },
      { status: 404 },
    );
  }

  try {
    const auth = createAuth();
    await auth.api.setUserPassword({
      headers: await headers(),
      body: {
        userId: record.userId,
        newPassword: parsed.data.password,
      },
    });

    return jsonResponse(
      {
        status: "success",
        message: "Password reset complete.",
      },
      { status: 200 },
    );
  } catch (error) {
    return jsonResponse(
      {
        status: "error",
        message: getErrorMessage(error, "Unable to reset password."),
      },
      { status: 500 },
    );
  }
}

export async function setSchoolAccessRecord(schoolId: string, active: boolean) {
  const db = getDb();
  const [record] = await db
    .select({ userId: school.userId })
    .from(school)
    .where(eq(school.id, schoolId))
    .limit(1);

  if (!record?.userId) {
    return jsonResponse(
      {
        status: "error",
        message: "School login does not exist yet.",
      },
      { status: 404 },
    );
  }

  const auth = createAuth();

  if (active) {
    await auth.api.unbanUser({
      headers: await headers(),
      body: {
        userId: record.userId,
      },
    });
  } else {
    await auth.api.banUser({
      headers: await headers(),
      body: {
        userId: record.userId,
        banReason: "Disabled by admin.",
      },
    });
  }

  return jsonResponse(
    {
      status: "success",
      message: active ? "School login reactivated." : "School login deactivated.",
    },
    { status: 200 },
  );
}
