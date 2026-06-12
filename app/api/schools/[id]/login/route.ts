import {
  createSchoolLoginRecord,
  readJsonBody,
  requireApiRole,
} from "@/lib/schools/server";
import type { SchoolLoginValues } from "@/lib/schools/api";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const auth = await requireApiRole("admin");

  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await params;
  const body = await readJsonBody<SchoolLoginValues>(request);

  return createSchoolLoginRecord(id, body);
}
