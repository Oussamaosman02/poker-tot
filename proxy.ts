import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Always allow auth API routes and public API routes
  if (pathname.startsWith("/api/auth")) return NextResponse.next();
  if (pathname.startsWith("/api/register")) return NextResponse.next();
  if (pathname.startsWith("/api/ai-action")) return NextResponse.next();
  if (pathname.startsWith("/api/hand-review")) return NextResponse.next();

  // Public pages
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (isPublicPage) {
    // Redirect logged-in users away from landing/auth pages to /home
    if (isLoggedIn) return NextResponse.redirect(new URL("/home", req.url));
    return NextResponse.next();
  }

  // Protected pages/API — redirect to landing if not logged in
  if (!isLoggedIn) return NextResponse.redirect(new URL("/", req.url));

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
