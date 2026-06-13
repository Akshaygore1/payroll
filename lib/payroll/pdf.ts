import {
  getRowPeriodLabel,
  summarizePayrollRows,
  type PayrollEmployeeRecord,
  type PayrollLedgerRowRecord,
  type PayrollSchoolRecord,
  type PayrollSettingsRecord,
} from "@/lib/payroll/api";
import { payrollColumnLabels } from "@/lib/payroll/core";

const pdfColumns = [
  "basicPay",
  "totalPay",
  "da",
  "daDifferenceArrears",
  "hra",
  "cla",
  "vaTaArrear",
  "totalEarnings",
  "recovery",
  "grandTotal",
  "gpf",
  "rd",
  "cmFund",
  "professionalTax",
  "revenueStamp",
  "incomeTax",
  "lic",
  "totalDeduction",
  "netSalary",
] as const;

export async function downloadPayrollPdf(options: {
  school: PayrollSchoolRecord;
  employee: PayrollEmployeeRecord;
  settings: PayrollSettingsRecord;
  financialYear: string;
  rows: PayrollLedgerRowRecord[];
  fileNameSuffix?: string;
}) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const totals = summarizePayrollRows(options.rows);
  const head = [
    [
      "Sr.",
      "Month / Row",
      ...pdfColumns.map((key) => payrollColumnLabels[key]),
    ],
  ];
  const body = options.rows.map((row, index) => [
    String(index + 1),
    getRowPeriodLabel(
      options.financialYear,
      options.settings.statementStartMonth,
      row,
    ),
    ...pdfColumns.map((key) => String(row[key])),
  ]);

  body.push([
    "",
    "Total",
    ...pdfColumns.map((key) => String(totals[key])),
  ]);

  doc.setFontSize(11);
  doc.text(
    `Statement Showing the Details of Pay & Allowances for ${options.financialYear}`,
    40,
    34,
  );
  doc.setFontSize(9);
  doc.text(`Office: ${options.school.schoolName}`, 40, 54);
  doc.text(`Principal: ${options.school.principalName}`, 40, 68);
  doc.text(`Employee: ${options.employee.fullName}`, 420, 54);
  doc.text(`Designation: ${options.employee.designation}`, 420, 68);
  doc.text(`PAN: ${options.employee.panNumber}`, 640, 54);
  doc.text(`Contact: ${options.employee.contactNumber}`, 640, 68);
  doc.text(`TAN No.: ${options.school.tanNo}`, 40, 82);

  autoTable(doc, {
    head,
    body,
    startY: 100,
    theme: "grid",
    styles: {
      fontSize: 6.5,
      cellPadding: 3,
      halign: "right",
      valign: "middle",
      lineColor: [120, 120, 120],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [30, 30, 30],
      halign: "center",
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 26, halign: "center" },
      1: { cellWidth: 82, halign: "left" },
    },
    margin: { left: 24, right: 24, bottom: 24 },
  });

  const fileNameParts = [
    options.employee.fullName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    options.financialYear,
    options.fileNameSuffix?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  ].filter(Boolean);
  const fileName = `${fileNameParts
    .join("-")
    .toLowerCase()
    .replace(/-+/g, "-")}.pdf`;
  doc.save(fileName);
}
