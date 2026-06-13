import { describe, expect, it } from "vitest";

import { calculateDerivedPayrollFields } from "@/lib/payroll/core";

describe("calculateDerivedPayrollFields", () => {
  it("matches the payroll statement formulas", () => {
    const totals = calculateDerivedPayrollFields({
      basicPay: 320214,
      totalPay: 320214,
      da: 127308,
      daDifferenceArrears: 10125,
      hra: 27475,
      cla: 8558,
      vaTaArrear: 0,
      recovery: 1000,
      gpf: 0,
      rd: 0,
      cmFund: 1148,
      professionalTax: 2500,
      revenueStamp: 12,
      incomeTax: 0,
      lic: 0,
    });

    expect(totals).toEqual({
      totalEarnings: 493680,
      grandTotal: 492680,
      totalDeduction: 3660,
      netSalary: 489020,
    });
  });
});
