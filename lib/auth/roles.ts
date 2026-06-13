export function getDefaultPathForRole(role?: string | null) {
  return role === "school" ? "/school" : "/dashboard";
}
