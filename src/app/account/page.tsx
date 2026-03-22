"use client"

import { SessionProvider } from 'next-auth/react'
import dynamic from 'next/dynamic'

const AccountContent = dynamic(
  () => import('./AccountContent'),
  { ssr: false, loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
    </div>
  )}
)

export default function AccountPage() {
  return (
    <SessionProvider>
      <AccountContent />
    </SessionProvider>
  )
}
