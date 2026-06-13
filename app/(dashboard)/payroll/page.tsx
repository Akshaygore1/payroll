"use client";

import { Suspense } from "react";

import { PayrollWorkspace } from "@/components/payroll/payroll-workspace";

export default function PayrollPage() {
  return (
    <Suspense fallback={null}>
      <PayrollWorkspace scope="admin" />
    </Suspense>
  );
}
