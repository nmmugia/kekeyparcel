import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getCachedData, invalidateCachePattern } from "@/lib/cache"

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

    // Bust cached package lists so new packages appear on /home immediately
    await invalidateCachePattern("home:packageTypes*")
    await invalidateCachePattern("api:packages*")

    return NextResponse.json(newPackage)
  } catch (error) {
    console.error("Error creating package:", error)
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
  }
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Package list rarely changes — cache for 24 hours
    const packages = await getCachedData(
      "api:packages:all",
      async () => db.package.findMany({ orderBy: { createdAt: "desc" } }),
      86400 // 24 hours TTL
    )

    return NextResponse.json(packages)
  } catch (error) {
    console.error("Error fetching packages:", error)
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 })
  }
}
