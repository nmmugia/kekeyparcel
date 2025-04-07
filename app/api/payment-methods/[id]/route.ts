import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const paymentMethod = await db.paymentMethod.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!paymentMethod) {
      return NextResponse.json({ error: "Payment method not found" }, { status: 404 })
    }

    return NextResponse.json(paymentMethod)
  } catch (error) {
    console.error("Error fetching payment method:", error)
    return NextResponse.json({ error: "Failed to fetch payment method" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const paymentMethod = await db.paymentMethod.update({
      where: {
        id: params.id,
      },
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
    console.error("Error updating payment method:", error)
    return NextResponse.json({ error: "Failed to update payment method" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db.paymentMethod.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payment method:", error)
    return NextResponse.json({ error: "Failed to delete payment method" }, { status: 500 })
  }
}

