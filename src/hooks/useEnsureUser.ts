"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * 首次登录时，将用户信息写入 D1 数据库
 * 解决 Edge Runtime 下 auth() 无法访问 D1 的问题
 */
export function useEnsureUser() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) return

    fetch('/api/ensure-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': session.user.id },
      body: JSON.stringify({
        email: session.user.email || '',
        name: session.user.name || '',
        image: session.user.image || '',
      }),
    }).catch(() => {})
  }, [session?.user?.id, status])
}
