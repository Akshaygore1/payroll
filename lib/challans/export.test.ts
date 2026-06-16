import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { createChallanWorkbookBuffer } from "@/lib/challans/export";

describe("createChallanWorkbookBuffer", () => {
  it("generates both required sheets with challan totals and employee adjustment rows", async () => {
    const buffer = await createChallanWorkbookBuffer({
      school: {
        id: "school-1",
        schoolName: "Riverdale High",
        principalName: "Mary Principal",
        address: "1 Main St",
        tanNo: "TAN123",
      },
      settings: {
        id: "settings-1",
        schoolId: "school-1",
        statementStartMonth: 4,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      employees: [
        {
          id: "employee-1",
          fullName: "Alice Johnson",
          designation: "Teacher",
          panNumber: "PAN1234A",
          gpfNumber: "GPF-1",
          pfNumber: "PF-1",
          npsAccountNumber: "NPS-1",
          contactNumber: "9999999999",
        },
        {
          id: "employee-2",
          fullName: "Bob Smith",
          designation: "Clerk",
          panNumber: "PAN5678B",
          gpfNumber: "GPF-2",
          pfNumber: "PF-2",
          npsAccountNumber: "NPS-2",
          contactNumber: "8888888888",
        },
      ],
      ledgerRows: [
        {
          id: "row-1",
          schoolId: "school-1",
          employeeId: "employee-2",
          employeeName: "Bob Smith",
          employeePanNumber: "PAN5678B",
          financialYear: "2024-25",
          rowType: "month",
          rowMonth: 4,
          rowLabel: "Apr-24",
          displayOrder: 0,
          incomeTax: 120,
          grandTotal: 2400,
        },
        {
          id: "row-2",
          schoolId: "school-1",
          employeeId: "employee-1",
          employeeName: "Alice Johnson",
          employeePanNumber: "PAN1234A",
          financialYear: "2024-25",
          rowType: "month",
          rowMonth: 4,
          rowLabel: "Apr-24",
          displayOrder: 0,
          incomeTax: 80,
          grandTotal: 1800,
        },
        {
          id: "row-3",
          schoolId: "school-1",
          employeeId: "employee-1",
          employeeName: "Alice Johnson",
          employeePanNumber: "PAN1234A",
          financialYear: "2024-25",
          rowType: "month",
          rowMonth: 5,
          rowLabel: "May-24",
          displayOrder: 1,
          incomeTax: 90,
          grandTotal: 1900,
        },
        {
          id: "row-4",
          schoolId: "school-1",
          employeeId: "employee-2",
          employeeName: "Bob Smith",
          employeePanNumber: "PAN5678B",
          financialYear: "2024-25",
          rowType: "month",
          rowMonth: 3,
          rowLabel: "Mar-25",
          displayOrder: 11,
          incomeTax: 40,
          grandTotal: 1500,
        },
      ],
      financialYear: "2024-25",
    });

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Challan",
      "Challan_adjustment",
    ]);

    const challanSheet = workbook.getWorksheet("Challan");
    expect(challanSheet.getCell("A1").value).toBe("TAN:");
    expect(challanSheet.getCell("B1").value).toBe("TAN123");
    expect(challanSheet.getCell("A5").value).toBe(1);
    expect(challanSheet.getCell("B5").value).toBe(200);
    expect(challanSheet.getCell("M5").value).toBe("No");
    expect(challanSheet.getCell("N5").value).toBe("200");
    expect(challanSheet.getCell("A16").value).toBe(12);
    expect(challanSheet.getCell("B16").value).toBe(40);

    const adjustmentSheet = workbook.getWorksheet("Challan_adjustment");
    expect(adjustmentSheet.getCell("D1").value).toBe(
      "Please do not Cut/Copy/Paste (it may cause inconsistancy in data).",
    );
    expect(adjustmentSheet.getCell("A4").value).toBe(1);
    expect(adjustmentSheet.getCell("C4").value).toBe("PAN1234A");
    expect(adjustmentSheet.getCell("D4").value).toBe("Alice Johnson");
    expect(adjustmentSheet.getCell("G4").value).toBe(1800);
    expect(adjustmentSheet.getCell("H4").value).toBe(80);
    expect(adjustmentSheet.getCell("L4").value).toBe(80);
    expect(adjustmentSheet.getCell("M4").value).toBe(80);
    expect(adjustmentSheet.getCell("R4").value).toBe(1);
    expect(adjustmentSheet.getCell("D5").value).toBe("Bob Smith");
    expect(adjustmentSheet.getCell("R6").value).toBe(2);
    expect(adjustmentSheet.getCell("R7").value).toBe(12);
    expect(adjustmentSheet.getCell("P4").value).toBe("");
    expect(adjustmentSheet.getCell("Q4").value).toBe("");
    expect(adjustmentSheet.getCell("S4").value).toBe("");
    expect(adjustmentSheet.getCell("T4").value).toBe("");
  });
});
