"use client"

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from "next-auth/react"

/** Header 组件 - 顶部导航栏（含用户下拉菜单） */
export default function Header() {
  const { data: session, status } = useSession()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // 同步 session 到全局变量（供 API 路由读取）
  useEffect(() => {
    if (session) {
      (window as any).__authSession = JSON.stringify(session)
    }
  }, [session])

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-sm font-bold text-white">
            B
          </div>
          <span className="text-lg font-bold text-gray-900">
            BG<span className="text-blue-600">Free</span>
          </span>
        </a>

        {/* 右侧 */}
        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : session?.user ? (
            <div className="relative" ref={dropdownRef}>
              {/* 头像按钮 */}
              <button
                onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown) }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-100"
              >
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full ring-2 ring-white"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span className="hidden text-sm text-gray-700 sm:inline">
                  {session.user.name?.split(" ")[0] || "用户"}
                </span>
                <svg className={`h-4 w-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
                </svg>
              </button>

              {/* 下拉菜单 */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-xl bg-white border border-gray-100 py-1 shadow-lg">
                  {/* 个人中心 */}
                  <a
                    href="/account"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0zM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                    </svg>
                    个人中心
                  </a>

                  {/* 退出 */}
                  <button
                    onClick={() => { setShowDropdown(false); signOut() }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition-colors hover:bg-red-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3-3 3-3m0 0-3-3m3 3H9" />
                    </svg>
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/api/auth/signin"
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>登录</span>
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
