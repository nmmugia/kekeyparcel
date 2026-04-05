import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getCachedData } from "@/lib/cache"
import MyPackagesList from "@/components/package/my-packages-list"

export default async function MyPackagesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "reseller") {
    redirect("/home")
  }

  const userId = session.user.id

  // Cache all transactions + payments for this reseller for 5 minutes.
  // Key is user-scoped so each reseller gets their own warm bucket.
  const { transactions, customerCount } = await getCachedData(
    `my-packages:${userId}`,
    async () => {
      const [transactions, customerCount] = await Promise.all([
        db.transaction.findMany({
          where: { resellerId: userId },
          include: { payments: true },
          orderBy: { createdAt: "desc" },
        }),
        db.transaction.count({
          where: { resellerId: userId },
        }),
      ])
      return { transactions, customerCount }
    },
    86400 // 24h TTL — invalidated on write by payment/transaction mutations
  )

  return (
    <div className="container mx-auto px-4 py-6">
      <MyPackagesList transactions={transactions} customerCount={customerCount} />
    </div>
  )
}
