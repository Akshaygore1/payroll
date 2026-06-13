"use client";

import {
  DashboardSquare01Icon,
  Invoice03Icon,
  School01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SignOutButton } from "@/components/auth/sign-out-button";

const adminItems = [
  { title: "Dashboard", url: "/dashboard", icon: DashboardSquare01Icon },
  { title: "Schools", url: "/schools", icon: School01Icon },
  { title: "Payroll", url: "/payroll", icon: Invoice03Icon },
];

const schoolItems = [
  { title: "School", url: "/school", icon: School01Icon },
  { title: "Employees", url: "/school/employees", icon: UserGroupIcon },
  { title: "Payroll", url: "/school/payroll", icon: Invoice03Icon },
];

type AppSidebarProps = {
  user: {
    email: string;
    name: string;
    role?: string | null;
  };
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const items = user.role === "school" ? schoolItems : adminItems;

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-12 items-center px-2 font-semibold tracking-tight">
          My App
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive =
                  pathname === item.url || pathname.startsWith(`${item.url}/`);
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url}>
                        <HugeiconsIcon icon={item.icon} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex flex-col gap-3 px-2 text-xs text-muted-foreground">
          <div className="flex flex-col gap-1">
            <div className="truncate font-medium text-foreground">{user.name}</div>
            <div className="truncate">{user.email}</div>
            <div className="uppercase tracking-widest">{user.role ?? "user"}</div>
          </div>
          <SignOutButton />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
