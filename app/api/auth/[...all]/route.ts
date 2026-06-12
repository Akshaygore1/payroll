import { createAuth } from "@/lib/auth/server";

function handleAuth(request: Request) {
  return createAuth().handler(request);
}

export { handleAuth as GET, handleAuth as POST };
