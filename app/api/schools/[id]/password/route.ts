import {
  readJsonBody,
  requireApiRole,
  resetSchoolPasswordRecord,
} from "@/lib/schools/server";
import type { SchoolPasswordValues } from "@/lib/schools/api";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: Props) {
  const auth = await requireApiRole("admin");

  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await params;
  const body = await readJsonBody<SchoolPasswordValues>(request);

  return resetSchoolPasswordRecord(id, body);
}
