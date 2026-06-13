"use client";

import { usePathname } from "next/navigation";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getDashboardRouteMetadata } from "@/lib/dashboard-route-metadata";

export function DashboardShellHeader() {
  const pathname = usePathname();
  const metadata = getDashboardRouteMetadata(pathname);

  return (
    <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
      <SidebarTrigger className="-ml-1" />
      <div className="min-w-0 space-y-0.5">
        <Breadcrumbs />
        <div className="font-medium leading-none">{metadata.title}</div>
        <p className="text-sm text-muted-foreground">{metadata.description}</p>
      </div>
    </header>
  );
}
