import { PricingPage } from './page'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export default async function PricingPageWrapper() {
  const session = await auth()
  return <PricingPage userEmail={session?.user?.email} />
}
