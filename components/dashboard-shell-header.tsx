"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/breadcrumbs";

export function DashboardShellHeader() {
  return (
    <header className="flex shrink-0 items-center gap-2 border-b border-b-accent/20 px-4 py-2 sm:px-6">
      <SidebarTrigger />
      <Breadcrumbs />
    </header>
  );
}
