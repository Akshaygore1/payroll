"use client";

import { Suspense } from "react";

import { PayslipWorkspace } from "@/components/payroll/payslip-workspace";

export default function SchoolPayslipPage() {
  return (
    <Suspense fallback={null}>
      <PayslipWorkspace scope="school" />
    </Suspense>
  );
}
