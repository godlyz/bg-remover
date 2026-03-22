/**
 * 从 NextAuth session cookie 获取用户信息
 * 
 * NextAuth v5 beta 加密了 JWT，无法直接解析。
 * 改用方案：前端在请求时通过自定义 header 传递用户 ID。
 * 前端从 NextAuth 的 useSession() 获取用户 ID 后附加到请求中。
 * 
 * 同时保留 cookie 解析作为降级方案。
 */
import { NextRequest } from 'next/server'

export function getUserId(request: NextRequest): string | null {
  // 优先从自定义 header 获取（前端 useSession 传入）
  const headerId = request.headers.get('x-user-id')
  if (headerId) return headerId

  // 降级：尝试从 NextAuth cookie 解析
  const cookie = request.headers.get('cookie') || ''
  
  // v5 可能用 __Secure-next-auth.session-token
  const match = cookie.match(/(?:__Secure-)?next-auth\.session-token=([^;]+)/)
  if (!match) return null

  try {
    const token = match[1]
    // v5 beta 可能加密了，尝试 base64 解析
    const parts = token.split('.')
    if (parts.length === 3) {
      // 标准 JWT 格式
      const payload = JSON.parse(atob(parts[1]))
      return payload.sub || ''
    }
    if (parts.length === 5) {
      // JWE 格式 (加密)，无法在 Edge Runtime 直接解密
      return null
    }
    return null
  } catch {
    return null
  }
}
