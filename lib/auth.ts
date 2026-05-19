import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import authConfig, { DEV_USER } from "@/auth.config"
import { prisma, isEmailAllowed } from "@/lib/db"
import { isAdminEmail } from "@/lib/admin"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma as never),
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true
      if (!user.email) return false
      if (isAdminEmail(user.email)) return true
      return await isEmailAllowed(user.email)
    },
  },
  events: {
    async signIn({ account }) {
      if (process.env.NODE_ENV !== "production" && account?.provider === "dev") {
        await prisma.user.upsert({
          where: { id: DEV_USER.id },
          update: {},
          create: { id: DEV_USER.id, email: DEV_USER.email, name: DEV_USER.name },
        })
      }
    },
  },
})
