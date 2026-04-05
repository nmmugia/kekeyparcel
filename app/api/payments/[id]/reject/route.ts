import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getCachedData, invalidateCachePattern } from "@/lib/cache"
import { redis } from "@/lib/redis"
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { note } = body

    const payment = await db.payment.update({
      where: {
        id: params.id,
      },
      data: {
        status: "rejected",
        note: note || "Pembayaran ditolak oleh admin",
      },
    })
    // Bust ALL related caches synchronously
    const payment_full = await db.payment.findUnique({ where: { id: params.id }, include: { transaction: true } })
    await Promise.all([
      invalidateCachePattern("api:payments:*"),
      invalidateCachePattern("api:reports:transactions:*"),
      invalidateCachePattern("report:totals:*"),
      invalidateCachePattern("api:stats:dashboard"),
      ...(payment_full ? [
        invalidateCachePattern(`api:reseller-report:${payment_full.transaction.resellerId}`),
        invalidateCachePattern(`my-packages:${payment_full.transaction.resellerId}`),
        invalidateCachePattern(`transaction:detail:${payment_full.transactionId}`),
      ] : []),
    ])

    // Cache Warming: Rebuild default pages synchronously
    await Promise.all([
      (async () => {
        const payments = await db.payment.findMany({ include: { transaction: true }, orderBy: { createdAt: "desc" }, take: 15 })
        const total = await db.payment.count()
        await redis.set("api:payments:admin:all:1", { payments, hasMore: 15 < total }, { ex: 86400 })
      })(),
      (async () => {
        if (session.user.role === "reseller") {
          const payments = await db.payment.findMany({ where: { resellerId: session.user.id }, include: { transaction: true }, orderBy: { createdAt: "desc" }, take: 15 })
          const total = await db.payment.count({ where: { resellerId: session.user.id } })
          await redis.set(`api:payments:${session.user.id}:all:1`, { payments, hasMore: 15 < total }, { ex: 86400 })
        }
      })()
    ])
    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error rejecting payment:", error)
    return NextResponse.json({ error: "Failed to reject payment" }, { status: 500 })
  }
}

