import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const runtime = "edge"

/** D1 REST API 查询 */
async function dbQuery(sql: string, params: any[] = []): Promise<{results: any[], success: boolean}> {
  const accountId = '3d3880f37301637156fefbf92e495102'
  const apiToken = 'cfat_pX978LoBmJpf9Lu48ylbpeY0VIzQ31HRJ4rj2PvA2c5216bf'
  const dbId = 'a4d77ae3-c6aa-44a3-85ae-dd1ce1c8f0ef'
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${dbId}/query`,
    { method: 'POST', headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ sql, params }) }
  )
  if (!res.ok) throw new Error(`D1 error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.result?.[0] || { results: [], success: false }
}

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
