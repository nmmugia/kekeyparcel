import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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

    return NextResponse.json(payment)
  } catch (error) {
    console.error("Error rejecting payment:", error)
    return NextResponse.json({ error: "Failed to reject payment" }, { status: 500 })
  }
}

