import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
});
