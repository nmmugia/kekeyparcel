import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import TransactionTabs from "@/components/transaction/transaction-tabs"

export default async function TransactionPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <TransactionTabs userRole={session.user.role} userId={session.user.id} />
    </div>
  )
}

