import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const runtime = "edge"

const getDB = () => process.env.DB as any
const dbQuery = async (sql: string, params: any[] = []) => {
  return (await getDB().prepare(sql).bind(...params).all()).results
}
const dbFirst = async (sql: string, params: any[] = []) => {
  return (await getDB().prepare(sql).bind(...params).first())
}
const dbRun = async (sql: string, params: any[] = []) => {
  await getDB().prepare(sql).bind(...params).run()
}

/** D1 REST API 查询 */

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
          const existing = await dbQuery(
            "SELECT id FROM users WHERE google_id = ?",
            [account.providerAccountId]
          )
          if (!existing.results || existing.results.length === 0) {
            await dbQuery(
              "INSERT INTO users (id, google_id, email, name, avatar_url, plan, cloud_used_lifetime) VALUES (?, ?, ?, ?, ?, 'free', 0)",
              [account.providerAccountId, account.providerAccountId, user.email || "", user.name || "", user.image || ""]
            )
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
