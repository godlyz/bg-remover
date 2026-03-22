"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

/** 用量不足弹窗 */
interface QuotaExceededModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'guest' | 'free' | 'paid'
  plan?: string
  used?: number
  total?: number
}

export default function QuotaExceededModal({ isOpen, onClose, type, plan, used, total }: QuotaExceededModalProps) {
  const { data: session, status: sessionStatus } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)

  if (!isOpen) return null

  const title = type === 'guest'
    ? '注册后获得 3 次云端免费体验'
    : type === 'free'
    ? '免费额度已用完'
    : '本月额度已用完'

  const description = type === 'guest'
    ? '注册后即可获得 3 次云端高质量去背景体验'
    : type === 'free'
    ? '升级套餐解锁更多云端处理次数'
    : '升级到更高套餐继续使用'

  const quotaText = type === 'guest'
    ? '未登录：最多 1 次云端'
    : `已用 ${used}/${total} 次`

  const primaryAction = type === 'guest' ? 'google' : 'upgrade'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {/* 图标 */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
          <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m6 6h.01m-6 5v2m0 0V9m6-5h.01" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>

        {/* 标题 */}
        <h3 className="mb-2 text-center text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mb-4 text-center text-sm text-gray-500">{description}</p>

        {/* 用量信息 */}
        <div className="mb-5 rounded-lg bg-gray-50 px-4 py-3 text-center text-sm text-gray-600">
          {quotaText}
          {type !== 'guest' && plan && (
            <div className="mt-1 text-xs text-gray-400">当前方案：{getPlanName(plan)}</div>
          )}
        </div>

        {/* 按钮 */}
        <div className="flex flex-col gap-2">
          {primaryAction === 'google' ? (
            <a
              href="/api/auth/signin"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Google 登录</span>
            </a>
          ) : (
            <Link
              href="/pricing"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <span>查看套餐</span>
            </Link>
          )}

          <button
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
          >
            {type === 'guest' ? '稍后再说' : '继续用本地模式'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getPlanName(plan: string): string {
  switch (plan) {
    case 'starter': return '入门 $9.99/月'
    case 'pro': return '进阶 $29.99/月'
    case 'business': return '专业 $79.99/月'
    default: return '免费'
  }
}
