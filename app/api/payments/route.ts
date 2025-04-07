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

