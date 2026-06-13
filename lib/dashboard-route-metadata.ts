export type DashboardRouteMetadata = {
  title: string;
  description: string;
};

const defaultMetadata: DashboardRouteMetadata = {
  title: "Workspace",
  description: "Manage school operations and payroll from one place.",
};

export function getDashboardRouteMetadata(
  pathname: string,
): DashboardRouteMetadata {
  if (pathname === "/dashboard") {
    return {
      title: "Dashboard",
      description: "Review operations, attention items, and next actions.",
    };
  }

  if (pathname === "/schools") {
    return {
      title: "Schools",
      description: "Manage school profiles, linked logins, and access state.",
    };
  }

  if (pathname === "/schools/new") {
    return {
      title: "Add School",
      description: "Create the school profile before assigning login access.",
    };
  }

  if (pathname.startsWith("/schools/")) {
    return {
      title: "School Details",
      description: "Review the school profile and manage account access.",
    };
  }

  if (pathname === "/school") {
    return {
      title: "School Profile",
      description: "Review the assigned school profile and account details.",
    };
  }

  if (pathname === "/school/employees") {
    return {
      title: "Employees",
      description: "Manage employee records used for payroll.",
    };
  }

  if (pathname === "/payroll") {
    return {
      title: "Payroll",
      description: "Select a school and manage payroll records.",
    };
  }

  if (pathname === "/school/payroll") {
    return {
      title: "Payroll",
      description: "Manage payroll records for your school.",
    };
  }

  return defaultMetadata;
}
