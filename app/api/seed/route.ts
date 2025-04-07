import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function GET() {
  const session = await getServerSession(authOptions)

  // Only allow in development or if admin
  if (process.env.NODE_ENV !== "development" && (!session || session.user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Create admin user
    const adminPassword = await hash("admin123", 10)
    await db.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        name: "Admin",
        password: adminPassword,
        role: "admin",
      },
    })

    // Create reseller user
    const resellerPassword = await hash("reseller123", 10)
    await db.user.upsert({
      where: { email: "reseller@example.com" },
      update: {},
      create: {
        email: "reseller@example.com",
        name: "Reseller Demo",
        password: resellerPassword,
        role: "reseller",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Seed error:", error)
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 })
  }
}

