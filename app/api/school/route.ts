import { getSchoolByUserId } from "@/lib/schools";
import { jsonResponse, requireApiRole } from "@/lib/schools/server";

function serializeSchool<T extends { createdAt: Date; updatedAt: Date }>(
  record: T,
) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function GET() {
  const auth = await requireApiRole("school");

  if ("response" in auth) {
    return auth.response;
  }

  const school = await getSchoolByUserId(auth.session.user.id);

  if (!school) {
    return jsonResponse({ error: "School not found." }, { status: 404 });
  }

  return jsonResponse({ school: serializeSchool(school) }, { status: 200 });
}
