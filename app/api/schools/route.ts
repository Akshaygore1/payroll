import { listSchools } from "@/lib/schools";
import {
  createSchoolRecord,
  jsonResponse,
  readJsonBody,
  requireApiRole,
} from "@/lib/schools/server";

function serializeDate(value: Date) {
  return value.toISOString();
}

function serializeSchool<T extends { createdAt: Date; updatedAt: Date }>(
  record: T,
) {
  return {
    ...record,
    createdAt: serializeDate(record.createdAt),
    updatedAt: serializeDate(record.updatedAt),
  };
}

export async function GET() {
  const auth = await requireApiRole("admin");

  if ("response" in auth) {
    return auth.response;
  }

  const schools = await listSchools();

  return jsonResponse(
    { schools: schools.map((item) => serializeSchool(item)) },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const auth = await requireApiRole("admin");

  if ("response" in auth) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  const { response } = await createSchoolRecord(body);

  return response;
}
