"use client";

import { Suspense } from "react";

import { PayrollWorkspace } from "@/components/payroll/payroll-workspace";

export default function SchoolPayrollPage() {
  return (
    <Suspense fallback={null}>
      <PayrollWorkspace scope="school" />
    </Suspense>
  );
}
