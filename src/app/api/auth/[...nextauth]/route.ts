import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { getCloudflareEnv } from '@/lib/cloudflare'

export const runtime = "edge"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, account }) {
      if (account) {
        token.sub = account.providerAccountId
      }
      return token
    },
    async signIn({ user, account }) {
      // 新用户首次登录，写入 D1 数据库
      if (account && user) {
        try {
          const env = getCloudflareEnv()
          const DB = env.DB
          if (DB && DB.prepare) {
            const existing = await DB.prepare(
              "SELECT id FROM users WHERE google_id = ?"
            ).bind(account.providerAccountId).first()
            if (!existing) {
              await DB.prepare(
                "INSERT INTO users (id, google_id, email, name, avatar_url, plan, cloud_used_lifetime) VALUES (?, ?, ?, ?, ?, 'free', 0)"
              ).bind(
                account.providerAccountId,
                account.providerAccountId,
                user.email || "",
                user.name || "",
                user.image || ""
              ).run()
            }
          }
        } catch (e) {
          console.error("DB write in signIn callback failed:", e)
        }
      }
      return true
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export const { GET, POST } = handlers
