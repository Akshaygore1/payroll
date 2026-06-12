import {
  jsonResponse,
  readJsonBody,
  requireApiRole,
  setSchoolAccessRecord,
} from "@/lib/schools/server";

type Props = {
  params: Promise<{ id: string }>;
};

type AccessBody = {
  active?: unknown;
};

export async function POST(request: Request, { params }: Props) {
  const auth = await requireApiRole("admin");

  if ("response" in auth) {
    return auth.response;
  }

  const { id } = await params;
  const body = await readJsonBody<AccessBody>(request);

  if (typeof body?.active !== "boolean") {
    return jsonResponse(
      {
        status: "error",
        message: "Access state is required.",
      },
      { status: 400 },
    );
  }

  return setSchoolAccessRecord(id, body.active);
}
