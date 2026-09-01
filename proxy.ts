import { NextResponse, type NextRequest, type ProxyConfig } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/session";

// The gate. This runs before every request that matches the list at the bottom,
// which is everything except the login screen itself and the files a browser
// needs in order to draw it.
//
// Because it sits here rather than inside each page, every screen built from now
// on is behind the PIN automatically — including the JSON export in phase 3,
// which is the one URL that must never be reachable without it.

export default async function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;

  if (await isValidSession(session)) {
    return NextResponse.next();
  }

  const login = request.nextUrl.clone();
  login.pathname = "/login";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config: ProxyConfig = {
  matcher: [
    // Everything except:
    //   login          — the gate itself, or there'd be no way in
    //   _next/*        — the app's own scripts and styles
    //   the icons and manifest — iOS fetches these when you add the app to the
    //                   home screen, before you've had a chance to log in
    "/((?!login|_next/|favicon\\.ico|icon\\.png|apple-icon\\.png|icon-192\\.png|icon-512\\.png|manifest\\.webmanifest).*)",
  ],
};
