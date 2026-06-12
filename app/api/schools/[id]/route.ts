import { getSchoolById } from "@/lib/schools";
import {
  jsonResponse,
  readJsonBody,
  requireApiRole,
  updateSchoolRecord,
} from "@/lib/schools/server";
import type { SchoolFormValues } from "@/lib/schools/api";

type Props = {
  params: Promise<{ id: string }>;
};

function serializeSchool<T extends { createdAt: Date; updatedAt: Date }>(
  record: T,
) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET(_request: Request, { params }: Props) {
  const auth = await requireApiRole("admin");

  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await params;
  const school = await getSchoolById(id);

  if (!school) {
    return jsonResponse({ error: "School not found." }, { status: 404 });
  }

  return jsonResponse({ school: serializeSchool(school) }, { status: 200 });
}

export async function PATCH(request: Request, { params }: Props) {
  const auth = await requireApiRole("admin");

  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await params;
  const body = await readJsonBody<SchoolFormValues>(request);

  return updateSchoolRecord(id, body);
}
