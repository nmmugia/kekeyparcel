import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

