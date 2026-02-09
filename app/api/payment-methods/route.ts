import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const paymentMethods = await db.paymentMethod.findMany({
      orderBy: {
        name: "asc",
      },
    })

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

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error("Error creating payment method:", error)
    return NextResponse.json({ error: "Failed to create payment method" }, { status: 500 })
  }
}

