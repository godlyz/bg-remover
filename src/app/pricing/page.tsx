"use client"

import { useState } from 'react'
import Link from 'next/link'

/** 套餐配置 */
const CREDIT_PLANS = [
  {
    id: 'credits_10',
    name: '小包',
    credits: 10,
    price: 4.99,
    unitPrice: 0.50,
    popular: false,
    desc: '偶尔使用',
  },
  {
    id: 'credits_30',
    name: '中包',
    credits: 30,
    price: 12.99,
    unitPrice: 0.43,
    popular: false,
    desc: '日常使用',
  },
  {
    id: 'credits_80',
    name: '大包',
    credits: 80,
    price: 29.90,
    unitPrice: 0.37,
    popular: true,
    desc: '批量处理',
  },
]

const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly_basic',
    name: '基础版',
    creditsPerMonth: 25,
    price: 9.99,
    popular: false,
    desc: '轻度使用',
  },
  {
    id: 'monthly_pro',
    name: '进阶版',
    creditsPerMonth: 60,
    price: 19.99,
    popular: true,
    desc: '重度使用',
  },
]

const FAQS = [
  {
    q: '本地去背景真的免费吗？',
    a: '是的，永久免费，不限次数，无需注册。',
  },
  {
    q: '云端去背景和本地有什么区别？',
    a: '本地在浏览器处理，速度快但质量一般；云端用专业 AI 处理，边缘更精细（头发丝、透明物体等）。',
  },
  {
    q: '免费额度用完了怎么办？',
    a: '注册后可获得 3 次云端免费体验，用完后可选择积分包或月订阅继续使用。',
  },
  {
    q: '积分包和月订阅怎么选？',
    a: '偶尔用选积分包（用完为止），经常用选月订阅（更划算）。',
  },
  {
    q: '积分会过期吗？',
    a: '积分自购买日起 365 天内有效。购买新积分时，有效期会自动延长。',
  },
  {
    q: '可以取消月订阅吗？',
    a: '可以，个人中心随时取消，取消后当前周期（30天）内仍可使用，周期结束后降为免费。',
  },
  {
    q: '支持哪些支付方式？',
    a: 'PayPal（支持信用卡、借记卡、PayPal 余额）。',
  },
  {
    q: '我的图片安全吗？',
    a: '本地模式图片不会上传；云端模式通过加密传输，处理完即删除。',
  },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handlePurchase = async (planId: string, planType: 'credit' | 'subscription') => {
    try {
      const endpoint = planType === 'subscription'
        ? '/api/payments/subscribe'
        : '/api/payments/create-order'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, planType }),
      })
      const data = await res.json()

      if (data.error === 'unauthorized') {
        // 未登录，跳转登录
        window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent('/pricing')}`
        return
      }

      if (data.error) {
        alert(data.message || '操作失败')
        return
      }

      // 跳转 PayPal
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      }
    } catch {
      alert('网络错误，请重试')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">B</div>
            <span className="text-lg font-bold text-gray-900">
              BG<span className="text-blue-600">Free</span>
            </span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← 返回首页
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* 标题 */}
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-bold text-gray-900">选择适合你的方案</h1>
          <p className="text-gray-500">本地去背景永久免费，云端高质量处理按需购买</p>
        </div>

        {/* 免费提示 */}
        <div className="mb-10 rounded-2xl border border-green-100 bg-green-50 p-4 text-center">
          <p className="text-sm text-green-700">
            ✅ <strong>免费用户</strong>：注册即享 3 次云端免费试用 + 本地无限次处理
          </p>
        </div>

        {/* 积分包 */}
        <div className="mb-12">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
            💰 一次性积分包
            <span className="ml-2 text-sm font-normal text-gray-400">用完为止，永不过期</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CREDIT_PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 text-center transition-shadow ${
                  plan.popular
                    ? 'border-blue-200 bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
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
                <div className="mb-4 text-xs text-gray-400">${plan.unitPrice.toFixed(2)} / 次</div>
                <button
                  onClick={() => handlePurchase(plan.id, 'credit')}
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    plan.popular
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

        {/* 月订阅 */}
        <div className="mb-16">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
            🔄 月订阅
            <span className="ml-2 text-sm font-normal text-gray-400">自动续费，随时取消</span>
          </h2>
          <div className="grid gap-4 max-w-lg mx-auto sm:grid-cols-2">
            {SUBSCRIPTION_PLANS.map(plan => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 text-center transition-shadow ${
                  plan.popular
                    ? 'border-blue-200 bg-blue-50 shadow-lg shadow-blue-100'
                    : 'border-gray-200 bg-white'
                }`}
              >
                {plan.popular && (
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
                <div className="mb-4 text-xs text-gray-400">${(plan.price / plan.creditsPerMonth).toFixed(2)} / 次</div>
                <button
                  onClick={() => handlePurchase(plan.id, 'subscription')}
                  className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
                    plan.popular
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

        {/* FAQ */}
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">常见问题</h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900"
                >
                  {faq.q}
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="border-t border-gray-100 px-5 py-4 text-sm text-gray-600">
                    {faq.a}
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
