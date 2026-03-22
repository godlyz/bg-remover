import { auth } from '@/app/api/auth/[...nextauth]/route'
import { PricingPage } from './PricingPage'

export const runtime = 'edge'

export default async function Page() {
  const session = await auth()
  return <PricingPage userEmail={session?.user?.email} />
}
