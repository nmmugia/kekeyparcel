import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hash } from "bcrypt"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check if user exists
    const user = await db.user.findUnique({
      where: {
        id: params.id,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate random password
    const newPassword = Math.random().toString(36).slice(-8)

    // Hash new password
    const hashedPassword = await hash(newPassword, 10)

    // Update password
    await db.user.update({
      where: {
        id: params.id,
      },
      data: {
        password: hashedPassword,
      },
    })

    return NextResponse.json({ success: true, newPassword })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}

