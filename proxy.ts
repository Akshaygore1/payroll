import { NextRequest, NextResponse } from "next/server";

import { createAuth } from "@/lib/auth/server";

export async function proxy(request: NextRequest) {
  const session = await createAuth().api.getSession({
    headers: request.headers,
  });

  if (session?.user?.role === "school") {
    return NextResponse.redirect(new URL("/school", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard"],
};
