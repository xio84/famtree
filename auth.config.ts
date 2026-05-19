import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export const DEV_USER = {
  id: "dev-user",
  email: "dev@famtree.local",
  name: "Dev User",
} as const

const isDev = process.env.NODE_ENV !== "production"

export default {
  providers: [
    Google,
    ...(isDev
      ? [
          Credentials({
            id: "dev",
            name: "Dev User",
            credentials: {},
            authorize: () => DEV_USER,
          }),
        ]
      : []),
  ],
  callbacks: {
    session({ session, token }) {
      if (token?.sub) session.user.id = token.sub
      return session
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  session: { strategy: "jwt" },
} satisfies NextAuthConfig
