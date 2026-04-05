import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { getCachedData } from "@/lib/cache"
import TransactionDetail from "@/components/transaction/transaction-detail"

interface TransactionPageProps {
  params: {
    id: string
  }
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const { id } = await params

  // Cache the transaction + its payments per transaction-id.
  // TTL of 2 minutes: short enough that payment status changes are reflected quickly.
  const transaction = await getCachedData(
    `transaction:detail:${id}`,
    async () => {
      return db.transaction.findUnique({
        where: { id },
        include: {
          payments: {
            orderBy: { createdAt: "desc" },
          },
        },
      })
    },
    86400 // 24h TTL — invalidated on write by payment/transaction mutations
  )

  if (!transaction) {
    notFound()
  }

  // Check if user is authorized to view this transaction
  if (session.user.role !== "admin" && transaction.resellerId !== session.user.id) {
    redirect("/home")
  }

  // Payment methods are almost never changed — safe to cache for 24 hours
  const paymentMethods = await getCachedData(
    "static:paymentMethods",
    async () => db.paymentMethod.findMany({ orderBy: { name: "asc" } }),
    86400 // 24 hours TTL
  )

  return (
    <div className="container mx-auto px-4 py-6">
      <TransactionDetail
        transaction={transaction}
        paymentMethods={paymentMethods}
        isAdmin={session.user.role === "admin"}
        userId={session.user.id}
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
      />
    </div>
  )
}
