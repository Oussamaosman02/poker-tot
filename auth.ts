import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        login: { label: "Email or Username" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const login = credentials?.login as string;
        const password = credentials?.password as string;
        if (!login || !password) return null;

        const user = await prisma.user.findFirst({
          where: { OR: [{ email: login }, { username: login }] },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.username };
      },
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
});
