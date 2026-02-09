import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const { name, icon } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const newPackageType = await db.packageType.create({
      data: {
        name,
        icon,
      },
    })

    return NextResponse.json(newPackageType)
  } catch (error) {
    console.error("Error creating package type:", error)
    return NextResponse.json({ error: "Failed to create package type" }, { status: 500 })
  }
}

