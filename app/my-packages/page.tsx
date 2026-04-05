import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
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

  const [rawTransactions, customerCount] = await Promise.all([
    db.transaction.findMany({
      where: { resellerId: userId },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
    }),
    db.transaction.count({
      where: { resellerId: userId },
    }),
  ])
  
  const transactions: any[] = rawTransactions.map(t => ({
    ...t,
    payments: t.payments.map(p => ({
      ...p,
      weekNumbers: typeof p.weekNumbers === "string" ? JSON.parse(p.weekNumbers) : p.weekNumbers
    }))
  }))

  return (
    <div className="container mx-auto px-4 py-6">
      <MyPackagesList transactions={transactions} customerCount={customerCount} />
    </div>
  )
}
