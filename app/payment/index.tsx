import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const resellerId = searchParams.get("resellerId")

    // Build the query
    const where: any = {}

    // Filter by status if provided
    if (status !== "all") {
      where.status = status
    }

    // Filter by reseller if provided or if current user is a reseller
    if (resellerId) {
      where.resellerId = resellerId
    } else if (session.user.role !== "admin") {
      where.resellerId = session.user.id
    }

    const payments = await db.payment.findMany({
      where,
      include: {
        transaction: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

