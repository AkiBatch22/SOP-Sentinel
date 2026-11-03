import { NextRequest, NextResponse } from "next/server";
import { getAuthConfig, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/login", "/api/auth/login", "/favicon.svg"]);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const config = getAuthConfig();
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (config && verifySessionToken(token, config.secret)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("returnTo", `${pathname}${search}`);
  if (!config) loginUrl.searchParams.set("reason", "configuration");
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
