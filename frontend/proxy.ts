import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  AUTH_PRESENCE_COOKIE_NAME,
  shouldRedirectFromProtectedRoute,
} from "./lib/auth/proxy-auth";

export default function proxy(request: NextRequest) {
  const authPresenceCookie = request.cookies.get(AUTH_PRESENCE_COOKIE_NAME)?.value;

  if (
    shouldRedirectFromProtectedRoute(
      request.nextUrl.pathname,
      authPresenceCookie,
    )
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
