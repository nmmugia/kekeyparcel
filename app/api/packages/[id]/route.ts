import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const packageData = await db.package.findUnique({
      where: {
        id: params.id,
      },
      include: {
        packageType: true,
      },
    })

    if (!packageData) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    return NextResponse.json(packageData)
  } catch (error) {
    console.error("Error fetching package:", error)
    return NextResponse.json({ error: "Failed to fetch package" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const updatedPackage = await db.package.update({
      where: {
        id: params.id,
      },
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

    return NextResponse.json(updatedPackage)
  } catch (error) {
    console.error("Error updating package:", error)
    return NextResponse.json({ error: "Failed to update package" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db.package.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting package:", error)
    return NextResponse.json({ error: "Failed to delete package" }, { status: 500 })
  }
}

