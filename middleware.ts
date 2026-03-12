import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // All API routes handle their own auth — never redirect them
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Allow static file downloads (APK, etc.)
  if (pathname.endsWith(".apk")) return NextResponse.next();

  // Public pages
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/register";

  if (isPublicPage) {
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
