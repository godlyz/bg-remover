"use client"

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function PaymentResultContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status') || 'unknown'
  const type = searchParams.get('type') || ''

  const isSuccess = status === 'success'

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4">
      {/* 图标 */}
      <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
        {isSuccess ? (
          <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>

      {/* 标题 */}
      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {isSuccess ? '支付成功' : '支付未完成'}
      </h1>

      {/* 描述 */}
      <p className="mb-8 text-center text-gray-500">
        {isSuccess ? (
          type === 'subscription'
            ? '月订阅已激活，现在可以使用云端处理了'
            : '积分已充值到你的账户，现在可以使用云端处理了'
        ) : (
          status === 'cancelled'
            ? '你已取消支付，如有问题请重试'
            : decodeURIComponent(searchParams.get('msg') || '支付遇到问题，请检查网络后重试')
        )}
      </p>

      {/* 按钮 */}
      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          开始使用
        </Link>
        {!isSuccess && (
          <Link
            href="/pricing"
            className="rounded-xl border border-gray-200 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            重新选择
          </Link>
        )}
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  )
}
