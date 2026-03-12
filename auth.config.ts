import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Lightweight config with NO Prisma — safe for Edge/Netlify middleware.
// The authorize callback here is intentionally empty; actual DB lookup
// only happens in auth.ts (server-side only, never in middleware).
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        login: { label: "Email or Username" },
        password: { label: "Password", type: "password" },
      },
      authorize: async () => null,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.username = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId as string;
      if (token.username) session.user.name = token.username as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
