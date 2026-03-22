"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 直接调用 /api/account，不需要 session（API 自己检查 cookie）
    fetch('/api/account')
      .then(res => {
        if (res.status === 401) {
          // 未登录，跳转首页
          router.push('/')
          return null
        }
        return res.json()
      })
      .then(data => {
        if (!data) return
        if (data.error) {
          setError(data.message)
          setLoading(false)
          return
        }
        setUserInfo(data)
        setLoading(false)

        // 获取用量
        return fetch('/api/usage')
          .then(res => res.json())
          .then(u => { if (!u.error) setUsage(u) })
          .catch(() => {})
      })
      .catch(() => {
        setError('获取用户信息失败')
        setLoading(false)
      })
  }, [router])

  const planName = (plan: string) => {
    switch (plan) {
      case 'starter': return '入门'
      case 'pro': return '进阶'
      case 'business': return '专业'
      default: return '免费'
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">{error}</div>
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">← 返回首页</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold text-gray-900">个人中心</h1>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-center gap-4">
          {userInfo.avatarUrl && (
            <img src={userInfo.avatarUrl} alt="" className="h-16 w-16 rounded-full ring-2 ring-gray-100" referrerPolicy="no-referrer" />
          )}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{userInfo.name}</h2>
            <p className="text-sm text-gray-500">{userInfo.email}</p>
            <p className="text-xs text-gray-400">注册时间: {userInfo.createdAt?.slice(0, 10)}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">当前套餐</h2>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600">
            {planName(userInfo.plan)}
          </span>
        </div>

        {usage && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>已用</span>
              <span>{usage.used} / {usage.total} 次</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, (usage.used / usage.total) * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              {usage.plan === 'free' ? '（终身额度）' : '（每月 1 号重置）'}
            </p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <Link href="/pricing" className="block w-full rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700">
            升级套餐
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">付费记录</h2>
        <div className="py-8 text-center text-sm text-gray-400">
          <p>暂无付费记录</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 返回首页</Link>
      </div>
    </div>
  )
}
