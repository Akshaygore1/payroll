import { asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { school, user } from "@/lib/db/schema";

export type SchoolListItem = {
  id: string;
  schoolName: string;
  principalName: string;
  address: string;
  tanNo: string;
  userId: string | null;
  loginEmail: string | null;
  isBanned: boolean | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SchoolDetail = SchoolListItem;

export async function listSchools() {
  const db = getDb();

  const rows = await db
    .select({
      id: school.id,
      schoolName: school.schoolName,
      principalName: school.principalName,
      address: school.address,
      tanNo: school.tanNo,
      userId: school.userId,
      loginEmail: user.email,
      isBanned: user.banned,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    })
    .from(school)
    .leftJoin(user, eq(school.userId, user.id))
    .orderBy(asc(school.schoolName));

  return rows satisfies SchoolListItem[];
}

export async function getSchoolById(id: string) {
  const db = getDb();

  const [record] = await db
    .select({
      id: school.id,
      schoolName: school.schoolName,
      principalName: school.principalName,
      address: school.address,
      tanNo: school.tanNo,
      userId: school.userId,
      loginEmail: user.email,
      isBanned: user.banned,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    })
    .from(school)
    .leftJoin(user, eq(school.userId, user.id))
    .where(eq(school.id, id))
    .limit(1);

  return (record ?? null) satisfies SchoolDetail | null;
}

export async function getSchoolByUserId(userId: string) {
  const db = getDb();

  const [record] = await db
    .select({
      id: school.id,
      schoolName: school.schoolName,
      principalName: school.principalName,
      address: school.address,
      tanNo: school.tanNo,
      userId: school.userId,
      loginEmail: user.email,
      isBanned: user.banned,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    })
    .from(school)
    .leftJoin(user, eq(school.userId, user.id))
    .where(eq(school.userId, userId))
    .limit(1);

  return (record ?? null) satisfies SchoolDetail | null;
}
