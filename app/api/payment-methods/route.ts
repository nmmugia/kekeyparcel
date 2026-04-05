import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getCachedData, invalidateCache } from "@/lib/cache"

export async function GET() {
  try {
    // Payment methods almost never change — safe to cache for 24 hours globally.
    // This is called on EVERY payment form open which could be multiple times per session.
    const paymentMethods = await getCachedData(
      "static:paymentMethods",
      async () => db.paymentMethod.findMany({ orderBy: { name: "asc" } }),
      86400 // 24 hours TTL
    )

    return NextResponse.json(paymentMethods)
  } catch (error) {
    console.error("Error fetching payment methods:", error)
    return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const { name, type, accountNumber, accountHolder, logo } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ error: "Name and type are required" }, { status: 400 })
    }

    const paymentMethod = await db.paymentMethod.create({
      data: {
        name,
        type,
        accountNumber,
        accountHolder,
        logo,
      },
    })

    // Bust the static cache so newly created methods appear immediately
    await invalidateCache(["static:paymentMethods"])

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error("Error creating payment method:", error)
    return NextResponse.json({ error: "Failed to create payment method" }, { status: 500 })
  }
}
