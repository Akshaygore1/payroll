export type SchoolRecord = {
  id: string;
  schoolName: string;
  principalName: string;
  address: string;
  tanNo: string;
  userId: string | null;
  loginEmail: string | null;
  isBanned: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type SchoolFormValues = {
  schoolName: string;
  principalName: string;
  address: string;
  tanNo: string;
};

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
  createdAt: string;
  updatedAt: string;
};

export type SchoolEmployeeValues = {
  fullName: string;
  designation: string;
  panNumber: string;
  gpfNumber: string;
  pfNumber: string;
  npsAccountNumber: string;
  whatsappNumber: string;
  contactNumber: string;
};

export type SchoolLoginValues = {
  email: string;
  password: string;
};

export type SchoolPasswordValues = {
  password: string;
};

export type SchoolFormField = keyof SchoolFormValues;
export type SchoolEmployeeField = keyof SchoolEmployeeValues;
export type SchoolLoginField = keyof SchoolLoginValues;

export type SchoolMutationResult<TField extends string = string> = {
  message?: string;
  status?: "error" | "success";
  fieldErrors?: Partial<Record<TField, string>>;
};

export type ApiErrorBody<TField extends string = string> =
  SchoolMutationResult<TField> & {
    error?: string;
  };

export class ApiError<TField extends string = string> extends Error {
  status: number;
  fieldErrors?: Partial<Record<TField, string>>;

  constructor(status: number, body: ApiErrorBody<TField>) {
    super(body.message ?? body.error ?? "Request failed.");
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = body.fieldErrors;
  }
}

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json().catch(() => ({}))) as T;
}

async function requestJson<TResponse, TField extends string = string>(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  const body = await readJson<TResponse & ApiErrorBody<TField>>(response);

  if (!response.ok) {
    throw new ApiError<TField>(response.status, body);
  }

  return body;
}

export function listSchoolsQuery() {
  return requestJson<{ schools: SchoolRecord[] }>("/api/schools");
}

export function getSchoolQuery(id: string) {
  return requestJson<{ school: SchoolRecord }>(`/api/schools/${id}`);
}

export function getCurrentSchoolQuery() {
  return requestJson<{ school: SchoolRecord }>("/api/school");
}

export function listSchoolEmployeesQuery() {
  return requestJson<{ employees: SchoolEmployeeRecord[] }>(
    "/api/school/employees",
  );
}

export function createSchoolMutation(values: SchoolFormValues) {
  return requestJson<
    SchoolMutationResult<SchoolFormField> & { school: { id: string } },
    SchoolFormField
  >("/api/schools", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateSchoolMutation(id: string, values: SchoolFormValues) {
  return requestJson<SchoolMutationResult<SchoolFormField>, SchoolFormField>(
    `/api/schools/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(values),
    },
  );
}

export function createSchoolEmployeeMutation(values: SchoolEmployeeValues) {
  return requestJson<
    SchoolMutationResult<SchoolEmployeeField> & {
      employee: SchoolEmployeeRecord;
    },
    SchoolEmployeeField
  >("/api/school/employees", {
    method: "POST",
    body: JSON.stringify(values),
  });
}

export function updateSchoolEmployeeMutation(
  id: string,
  values: SchoolEmployeeValues,
) {
  return requestJson<
    SchoolMutationResult<SchoolEmployeeField> & {
      employee: SchoolEmployeeRecord;
    },
    SchoolEmployeeField
  >(`/api/school/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  });
}

export function deleteSchoolEmployeeMutation(id: string) {
  return requestJson<SchoolMutationResult>(`/api/school/employees/${id}`, {
    method: "DELETE",
  });
}

export function createSchoolLoginMutation(
  id: string,
  values: SchoolLoginValues,
) {
  return requestJson<SchoolMutationResult<SchoolLoginField>, SchoolLoginField>(
    `/api/schools/${id}/login`,
    {
      method: "POST",
      body: JSON.stringify(values),
    },
  );
}

export function resetSchoolPasswordMutation(
  id: string,
  values: SchoolPasswordValues,
) {
  return requestJson<SchoolMutationResult<"password">, "password">(
    `/api/schools/${id}/password`,
    {
      method: "POST",
      body: JSON.stringify(values),
    },
  );
}

export function setSchoolAccessMutation(id: string, active: boolean) {
  return requestJson<SchoolMutationResult>(`/api/schools/${id}/access`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}
