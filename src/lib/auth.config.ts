import type { NextAuthConfig } from "next-auth";

/**
 * Proxy-safe auth config — no database imports. The full config with the
 * Credentials provider lives in auth.ts; the proxy only needs the session
 * cookie check in `authorized`.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // 12 hours
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoginPage = pathname === "/admin/login";
      const isAdminArea = pathname.startsWith("/admin");
      const loggedIn = Boolean(auth?.user);

      if (isLoginPage) {
        if (loggedIn) {
          return Response.redirect(new URL("/admin", request.nextUrl));
        }
        return true;
      }
      if (isAdminArea) return loggedIn; // false → redirect to signIn page
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
