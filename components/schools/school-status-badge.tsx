import { Badge } from "@/components/ui/badge";

type SchoolStatusBadgeProps = {
  userId: string | null;
  isBanned: boolean | null;
};

export function SchoolStatusBadge({ userId, isBanned }: SchoolStatusBadgeProps) {
  if (!userId) {
    return <Badge variant="secondary">No Login</Badge>;
  }

  if (isBanned) {
    return <Badge variant="destructive">Inactive</Badge>;
  }

  return <Badge>Active</Badge>;
}
