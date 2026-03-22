"use client"

import { SessionProvider } from 'next-auth/react'
import { PricingPage } from './PricingPage'

export default function PricingWrapper() {
  return (
    <SessionProvider>
      <PricingPage />
    </SessionProvider>
  )
}
