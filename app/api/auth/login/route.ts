import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getAuthConfig,
  passwordsMatch,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth";

function safeReturnTo(value: FormDataEntryValue | null): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/guardrail.html";
}

export async function POST(request: NextRequest) {
  const config = getAuthConfig();
  if (!config) {
    return NextResponse.redirect(new URL("/login?reason=configuration", request.url), 303);
  }

  const form = await request.formData();
  const password = form.get("password");
  const returnTo = safeReturnTo(form.get("returnTo"));

  if (typeof password !== "string" || !passwordsMatch(password, config.password)) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "invalid");
    loginUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(SESSION_COOKIE, createSessionToken(config.secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
