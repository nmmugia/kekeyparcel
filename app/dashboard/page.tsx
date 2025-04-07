import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import AdminDashboard from "@/components/dashboard/admin-dashboard"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  // Get dashboard statistics
  const resellerCount = await db.user.count({
    where: {
      role: "reseller",
    },
  })

  const packageCount = await db.package.count()

  const transactionCount = await db.transaction.count()

  const totalPayments = await db.payment.aggregate({
    where: {
      status: "confirmed",
    },
    _sum: {
      amount: true,
    },
  })

  // Get recent transactions
  const recentTransactions = await db.transaction.findMany({
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      payments: {
        where: {
          status: "confirmed",
        },
      },
    },
  })

  // Get pending payments
  const pendingPayments = await db.payment.findMany({
    where: {
      status: "process",
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      transaction: true,
    },
  })

  // Get top resellers
  const topResellers = await db.user.findMany({
    where: {
      role: "reseller",
    },
    take: 5,
    orderBy: {
      transactions: {
        _count: "desc",
      },
    },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
      transactions: {
        select: {
          payments: {
            where: {
              status: "confirmed",
            },
            select: {
              amount: true,
            },
          },
        },
      },
    },
  })

  // Calculate total amount for each reseller
  const topResellersWithTotal = topResellers.map((reseller) => {
    const totalAmount = reseller.transactions.reduce((sum, transaction) => {
      return sum + transaction.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
    }, 0)

    return {
      ...reseller,
      totalAmount,
    }
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Admin</h1>
      <AdminDashboard
        stats={{
          resellerCount,
          packageCount,
          transactionCount,
          totalPayments: totalPayments._sum.amount || 0,
        }}
        recentTransactions={recentTransactions}
        pendingPayments={pendingPayments}
        topResellers={topResellersWithTotal}
      />
    </div>
  )
}

