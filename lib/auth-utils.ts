import { auth } from "@/auth";
import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

export async function getUserId(req: NextRequest): Promise<string | null> {
  // Check Bearer token first (mobile clients)
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      return payload.userId as string;
    } catch {
      return null;
    }
  }

  // Fall back to web session (cookie-based)
  const session = await auth();
  return session?.user?.id ?? null;
}
