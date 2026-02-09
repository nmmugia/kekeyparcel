import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const packageType = await db.packageType.findUnique({
      where: {
        id: params.id,
      },
      include: {
        packages: true,
      },
    })

    if (!packageType) {
      return NextResponse.json({ error: "Package type not found" }, { status: 404 })
    }

    return NextResponse.json(packageType)
  } catch (error) {
    console.error("Error fetching package type:", error)
    return NextResponse.json({ error: "Failed to fetch package type" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    const updatedPackageType = await db.packageType.update({
      where: {
        id: params.id,
      },
      data: {
        name,
        icon,
      },
    })

    return NextResponse.json(updatedPackageType)
  } catch (error) {
    console.error("Error updating package type:", error)
    return NextResponse.json({ error: "Failed to update package type" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await db.packageType.delete({
      where: {
        id: params.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting package type:", error)
    return NextResponse.json({ error: "Failed to delete package type" }, { status: 500 })
  }
}

