import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { school, schoolEmployee } from "@/lib/db/schema";
import type { SchoolEmployeeValues } from "@/lib/schools/api";

export type SchoolEmployeeRecord = {
  id: string;
  schoolId: string;
  fullName: string;
  designation: string;
  panNumber: string;
  gpfNumber: string;
  pfNumber: string;
  npsAccountNumber: string;
  whatsappNumber: string;
  contactNumber: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function getSchoolIdForUser(userId: string) {
  const db = getDb();
  const [record] = await db
    .select({ id: school.id })
    .from(school)
    .where(eq(school.userId, userId))
    .limit(1);

  return record?.id ?? null;
}

export async function listSchoolEmployees(schoolId: string) {
  const db = getDb();

  const rows = await db
    .select({
      id: schoolEmployee.id,
      schoolId: schoolEmployee.schoolId,
      fullName: schoolEmployee.fullName,
      designation: schoolEmployee.designation,
      panNumber: schoolEmployee.panNumber,
      gpfNumber: schoolEmployee.gpfNumber,
      pfNumber: schoolEmployee.pfNumber,
      npsAccountNumber: schoolEmployee.npsAccountNumber,
      whatsappNumber: schoolEmployee.whatsappNumber,
      contactNumber: schoolEmployee.contactNumber,
      createdAt: schoolEmployee.createdAt,
      updatedAt: schoolEmployee.updatedAt,
    })
    .from(schoolEmployee)
    .where(eq(schoolEmployee.schoolId, schoolId))
    .orderBy(asc(schoolEmployee.fullName));

  return rows satisfies SchoolEmployeeRecord[];
}

export async function createSchoolEmployee(
  schoolId: string,
  values: SchoolEmployeeValues,
) {
  const db = getDb();
  const [createdEmployee] = await db
    .insert(schoolEmployee)
    .values({
      id: crypto.randomUUID(),
      schoolId,
      ...values,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({
      id: schoolEmployee.id,
      schoolId: schoolEmployee.schoolId,
      fullName: schoolEmployee.fullName,
      designation: schoolEmployee.designation,
      panNumber: schoolEmployee.panNumber,
      gpfNumber: schoolEmployee.gpfNumber,
      pfNumber: schoolEmployee.pfNumber,
      npsAccountNumber: schoolEmployee.npsAccountNumber,
      whatsappNumber: schoolEmployee.whatsappNumber,
      contactNumber: schoolEmployee.contactNumber,
      createdAt: schoolEmployee.createdAt,
      updatedAt: schoolEmployee.updatedAt,
    });

  return createdEmployee satisfies SchoolEmployeeRecord;
}

export async function updateSchoolEmployee(
  schoolId: string,
  employeeId: string,
  values: SchoolEmployeeValues,
) {
  const db = getDb();
  const [updatedEmployee] = await db
    .update(schoolEmployee)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schoolEmployee.id, employeeId),
        eq(schoolEmployee.schoolId, schoolId),
      ),
    )
    .returning({
      id: schoolEmployee.id,
      schoolId: schoolEmployee.schoolId,
      fullName: schoolEmployee.fullName,
      designation: schoolEmployee.designation,
      panNumber: schoolEmployee.panNumber,
      gpfNumber: schoolEmployee.gpfNumber,
      pfNumber: schoolEmployee.pfNumber,
      npsAccountNumber: schoolEmployee.npsAccountNumber,
      whatsappNumber: schoolEmployee.whatsappNumber,
      contactNumber: schoolEmployee.contactNumber,
      createdAt: schoolEmployee.createdAt,
      updatedAt: schoolEmployee.updatedAt,
    });

  return (updatedEmployee ?? null) satisfies SchoolEmployeeRecord | null;
}

export async function deleteSchoolEmployee(
  schoolId: string,
  employeeId: string,
) {
  const db = getDb();
  const [deletedEmployee] = await db
    .delete(schoolEmployee)
    .where(
      and(
        eq(schoolEmployee.id, employeeId),
        eq(schoolEmployee.schoolId, schoolId),
      ),
    )
    .returning({ id: schoolEmployee.id });

  return deletedEmployee?.id ?? null;
}
