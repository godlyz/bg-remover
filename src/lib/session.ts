/**
 * 从 NextAuth cookie 中解析 session
 * 不依赖 auth()，兼容 Cloudflare Edge Runtime
 */
export function getSessionFromRequest(request: NextRequest): { user: { id: string; email: string; name: string; image: string } } | null {
  const cookie = request.headers.get('cookie') || ''
  const match = cookie.match(/next-auth\.session-token=([^;]+)/)
  if (!match) return null

  try {
    const token = match[1]
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = JSON.parse(atob(parts[0] + '.' + parts[1]))
    return {
      user: {
        id: payload.sub || '',
        email: payload.email || '',
        name: payload.name || '',
        image: payload.picture || '',
      },
    }
  } catch {
    return null
  }
}
