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

    const { name, description, pricePerWeek, tenor, packageTypeId, isEligibleBonus, photo } = body

    // Validate required fields
    if (!name || !pricePerWeek || !tenor || !packageTypeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newPackage = await db.package.create({
      data: {
        name,
        description,
        pricePerWeek,
        tenor,
        packageTypeId,
        isEligibleBonus,
        photo,
      },
    })

    return NextResponse.json(newPackage)
  } catch (error) {
    console.error("Error creating package:", error)
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
  }
}

