import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getCachedData, invalidateCachePattern } from "@/lib/cache"
import { redis } from "@/lib/redis"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const {
      transactionId,
      amount,
      weekNumbers,
      paymentMethod,
      bankName,
      proofImage,
      note,
      resellerId,
      resellerName,
      resellerEmail,
    } = body

    // Validate required fields
    const paymentMethods = await db.paymentMethod.findUnique({
      where: {
        id: paymentMethod,
      },
    })

    if (!proofImage && paymentMethods?.type === "bank") {
      return NextResponse.json({ error: "Silakan unggah bukti pembayaran" }, { status: 400 })
    }

    if (!transactionId || !amount || !weekNumbers || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create payment
    const payment = await db.payment.create({
      data: {
        transactionId,
        amount,
        weekNumbers,
        paymentMethod,
        bankName,
        proofImage,
        note,
        status: "process",
        resellerId,
        resellerName,
        resellerEmail,
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
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}


export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 15

    // Build the query
    const where: any = {}

    // Filter by status if provided
    if (status !== "all") {
      where.status = status
    }

    // Filter by reseller if provided or if current user is a reseller
    if (session.user.role !== "admin") {
      where.resellerId = session.user.id
    }

    // Server-side search support
    if (search) {
      where.transaction = {
        OR: [
          { packageName: { contains: search, mode: "insensitive" } },
          { customerName: { contains: search, mode: "insensitive" } },
        ]
      }
    }

    const cacheKey = search
      ? `api:payments:${session.user.role === 'admin' ? 'admin' : session.user.id}:${status}:${page}:search_${search}`
      : `api:payments:${session.user.role === 'admin' ? 'admin' : session.user.id}:${status}:${page}`

    const cachedResponse = await getCachedData(cacheKey, async () => {
      const checkHasMore = await db.payment.count({ where })

      const payments = await db.payment.findMany({
        where,
        include: {
          transaction: true
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: (page - 1) * limit,
      })

      return {
        payments,
        hasMore: page * limit < checkHasMore
      }
    }, 60) // Cache API paginated block for 60 seconds

    return NextResponse.json(cachedResponse)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

