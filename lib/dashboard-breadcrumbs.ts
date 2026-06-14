export type BreadcrumbSegment = {
  label: string;
  href: string;
};

const segmentLabelMap: Record<string, string> = {
  dashboard: "Dashboard",
  schools: "Schools",
  new: "Add School",
  school: "School Profile",
  employees: "Employees",
  payroll: "Payroll",
  payslip: "Payslip",
};

export function getBreadcrumbSegments(pathname: string): BreadcrumbSegment[] {
  if (pathname === "/dashboard") {
    return [{ label: "Dashboard", href: "/dashboard" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const trail: BreadcrumbSegment[] = [];
  let accumulated = "";

  for (const segment of segments) {
    accumulated += `/${segment}`;

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      trail.push({ label: "School Details", href: accumulated });
    } else {
      trail.push({ label: segmentLabelMap[segment] ?? segment, href: accumulated });
    }
  }

  return trail;
}
