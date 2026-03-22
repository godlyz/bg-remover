"use client"

import { useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'

/** 套餐配置 */
const CREDIT_PLANS = [
  {
    id: 'credits_10',
    name: '小包',
    desc: '偶尔使用',
    credits: 10,
    price: 4.99,
    perPrice: 0.5,
  },
  {
    id: 'credits_30',
    name: '中包',
    desc: '日常使用',
    credits: 30,
    price: 12.99,
    perPrice: 0.43,
  },
  {
    id: 'credits_80',
    name: '大包',
    desc: '批量处理',
    credits: 80,
    price: 29.9,
    perPrice: 0.37,
    recommended: true,
  },
]

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly_basic',
    name: '基础版',
    desc: '轻度使用',
    creditsPerMonth: 25,
    price: 9.99,
    perPrice: 0.40,
  },
  {
    id: 'monthly_pro',
    name: '进阶版',
    desc: '重度使用',
    creditsPerMonth: 60,
    price: 19.99,
    perPrice: 0.33,
    recommended: true,
  },
]

const FAQ = [
  {
    q: '本地去背景真的免费吗？',
    a: '是的！本地处理完全在浏览器中进行，不需要上传图片到服务器，永久免费，无限次使用。',
  },
  {
    q: '云端去背景和本地有什么区别？',
    a: '本地处理：完全免费、无需注册、数据不上传，适合偶尔使用。云端处理：使用专业 AI 模型，效果更好，适合需要高质量结果的场景。',
  },
  {
    q: '免费额度用完了怎么办？',
    a: '可以购买积分包或订阅套餐。积分包永不过期，月订阅每月自动续费可随时取消。',
  },
  {
    q: '积分包和月订阅怎么选？',
    a: '积分包：用完为止，永不过期，适合偶尔使用。月订阅：每月固定额度，价格更优惠，适合频繁使用。',
  },
  {
    q: '积分会过期吗？',
    a: '积分包购买的积分永不过期。月订阅的积分每月重置。',
  },
  {
    q: '可以取消月订阅吗？',
    a: '可以随时在个人中心取消订阅。取消后当月权益仍可使用，下月起不再续费。',
  },
  {
    q: '支持哪些支付方式？',
    a: '目前支持 PayPal 支付，支持信用卡、借记卡和 PayPal 余额。',
  },
  {
    q: '我的图片安全吗？',
    a: '本地处理的图片完全不上传。云端处理的图片在上传后立即删除，不会保留任何记录。',
  },
]

export function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>
  }

  // 用户唯一标识：优先用 session.user.id（NextAuth JWT callback 设置的 token.sub）
  const userId = session?.user?.id || ''

  const handlePurchase = async (planId: string, planType: 'credit' | 'subscription') => {
    if (!userId) {
      signIn('google', { callbackUrl: '/pricing' })
      return
    }

    try {
      alert('正在创建订单...')

      const endpoint = planType === 'subscription'
        ? '/api/payments/subscribe'
        : '/api/payments/create-order'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ planId, planType }),
      })
      const data = await res.json()

      if (data.error === 'unauthorized') {
        signIn('google', { callbackUrl: '/pricing' })
        return
      }

      if (data.error) {
        if (data.approvalUrl) {
          window.location.href = data.approvalUrl
        } else {
          const failUrl = `/payment?status=failed&msg=${encodeURIComponent(data.details || data.message || '操作失败')}`
          console.error('Purchase failed:', JSON.stringify(data))
          window.location.href = failUrl
        }
        return
      }

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      }
    } catch {
      alert('网络错误，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <a className="flex items-center gap-2" href="/">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">B</div>
            <span className="text-lg font-bold text-gray-900">BG<span className="text-blue-600">Free</span></span>
          </a>
          <a className="text-sm text-gray-500 hover:text-gray-700 transition-colors" href="/">← 返回首页</a>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-900">选择适合你的方案</h1>
          <p className="text-gray-500">本地去背景永久免费，云端高质量处理按需购买</p>
          {session && (
            <p className="mt-2 text-sm text-green-600">✅ 已登录：{session.user?.email}</p>
          )}
        </div>

        <div className="mb-10 rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-sm text-green-700">✅ <strong>免费用户</strong>：注册即享 3 次云端免费试用 + 本地无限次处理</p>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">💰 一次性积分包<span className="ml-2 text-sm font-normal text-gray-400">用完为止，永不过期</span></h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CREDIT_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 text-center transition-shadow ${
                  plan.recommended
                    ? 'border-blue-200 bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                    推荐
                  </div>
                )}
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mb-3 text-sm text-gray-400">{plan.desc}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                </div>
                <div className="mb-1 text-sm text-gray-600">{plan.credits} 次云端处理</div>
                <div className="mb-4 text-xs text-gray-400">${plan.perPrice} / 次</div>
                <button
                  onClick={() => handlePurchase(plan.id, 'credit')}
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    plan.recommended
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  购买
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">🔄 月订阅<span className="ml-2 text-sm font-normal text-gray-400">自动续费，随时取消</span></h2>
          <div className="grid gap-4 max-w-lg mx-auto sm:grid-cols-2">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 text-center transition-shadow ${
                  plan.recommended
                    ? 'border-blue-200 bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-medium text-white">
                    推荐
                  </div>
                )}
                <h3 className="mb-1 text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mb-3 text-sm text-gray-400">{plan.desc}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-sm text-gray-400"> / 月</span>
                </div>
                <div className="mb-1 text-sm text-gray-600">{plan.creditsPerMonth} 次 / 月</div>
                <div className="mb-4 text-xs text-gray-400">${plan.perPrice} / 次</div>
                <button
                  onClick={() => handlePurchase(plan.id, 'subscription')}
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    plan.recommended
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  订阅
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">常见问题</h2>
          <div className="space-y-3">
            {FAQ.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-white"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900"
                >
                  {item.q}
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-sm text-gray-600">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
