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

  // Get all transactions for this reseller
  const transactions = await db.transaction.findMany({
    where: {
      resellerId: session.user.id,
    },
    include: {
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
  const customerCount = await db.transaction.count({
    where: {
      resellerId: session.user.id,
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <MyPackagesList transactions={transactions} customerCount={customerCount} />
    </div>
  )
}

