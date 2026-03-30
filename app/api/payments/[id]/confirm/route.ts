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
    const payment = await db.payment.update({
      where: {
        id: params.id,
      },
      data: {
        status: "confirmed",
      },
    })
    // Fire-and-forget wildcard invalidation of ALL related metric pages since a financial event occurred
    invalidateCachePattern("api:payments:*")
    invalidateCachePattern("api:reports:transactions:*")
    invalidateCachePattern("report:totals:*")

    // 🔥 Advanced Cache Warming: Instantly rebuild and push the default primary pages into Redis in the background so the user NEVER suffers a cache miss penalty after paying!
    Promise.all([
      (async () => {
        // Rebuild Admin's Default Page 1
        const payments = await db.payment.findMany({ include: { transaction: true }, orderBy: { createdAt: "desc" }, take: 15 })
        const total = await db.payment.count()
        await redis.set("api:payments:admin:all:1", { payments, hasMore: 15 < total }, { ex: 86400 })
      })(),
      (async () => {
        // Rebuild Current User's Default Page 1
        if (session.user.role === "reseller") {
          const payments = await db.payment.findMany({ where: { resellerId: session.user.id }, include: { transaction: true }, orderBy: { createdAt: "desc" }, take: 15 })
          const total = await db.payment.count({ where: { resellerId: session.user.id } })
          await redis.set(`api:payments:${session.user.id}:all:1`, { payments, hasMore: 15 < total }, { ex: 86400 })
        }
      })()
    ]).catch(console.error)
    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json({ error: "Failed to confirm payment" }, { status: 500 })
  }
}

