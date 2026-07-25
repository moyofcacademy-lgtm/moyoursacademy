import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next.js 16: middleware is now "proxy". This is an optimistic session-cookie
// check only — every admin page and server action re-verifies with auth().
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*"],
};
