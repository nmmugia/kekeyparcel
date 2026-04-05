import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [
      resellerCount,
      packageCount,
      transactionCount,
      totalPayments,
      recentTransactions,
      pendingPayments,
      topResellers,
    ] = await Promise.all([
      db.user.count({ where: { role: "reseller" } }),
      db.package.count(),
      db.transaction.count(),
      db.payment.aggregate({
        where: { status: "confirmed" },
        _sum: { amount: true },
      }),
      db.transaction.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          payments: { where: { status: "confirmed" } },
        },
      }),
      db.payment.findMany({
        where: { status: "process" },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { transaction: true },
      }),
      db.user.findMany({
        where: { role: "reseller" },
        take: 5,
        orderBy: { transactions: { _count: "desc" } },
        include: {
          _count: { select: { transactions: true } },
          transactions: {
            select: {
              payments: {
                where: { status: "confirmed" },
                select: { amount: true },
              },
            },
          },
        },
      }),
    ])

    // Calculate total amount for each reseller (done in JS, not Postgres)
    const topResellersWithTotal = topResellers.map((reseller: any) => {
      const totalAmount = reseller.transactions.reduce((sum: number, transaction: any) => {
        return sum + transaction.payments.reduce((paymentSum: number, payment: any) => paymentSum + payment.amount, 0)
      }, 0)
      return { ...reseller, totalAmount }
    })

    const parsedRecentTransactions = recentTransactions.map((t: any) => ({
      ...t,
      payments: t.payments.map((p: any) => ({
        ...p,
        weekNumbers: typeof p.weekNumbers === "string" ? JSON.parse(p.weekNumbers) : p.weekNumbers
      }))
    }))

    const parsedPendingPayments = pendingPayments.map((p: any) => ({
      ...p,
      weekNumbers: typeof p.weekNumbers === "string" ? JSON.parse(p.weekNumbers) : p.weekNumbers
    }))

    const stats = {
      stats: {
        resellerCount,
        packageCount,
        transactionCount,
        totalPayments: totalPayments._sum.amount || 0,
      },
      recentTransactions: parsedRecentTransactions,
      pendingPayments: parsedPendingPayments,
      topResellers: topResellersWithTotal,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
