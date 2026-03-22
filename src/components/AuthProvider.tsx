"use client"

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

/**
 * AuthProvider - 提供 NextAuth Session 上下文
 * 同时将 session 同步到 window.__authSession 供 API 路由读取
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (session) {
      (window as any).__authSession = JSON.stringify(session)
    } else {
      delete (window as any).__authSession
    }
  }, [session])

  // 加载中不渲染子组件（避免 prerender 问题）
  if (status === 'loading') {
    return null
  }

  return <>{children}</>
}
