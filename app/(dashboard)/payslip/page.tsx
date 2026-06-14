"use client";

import { Suspense } from "react";

import { PayslipWorkspace } from "@/components/payroll/payslip-workspace";

export default function PayslipPage() {
  return (
    <Suspense fallback={null}>
      <PayslipWorkspace scope="admin" />
    </Suspense>
  );
}
