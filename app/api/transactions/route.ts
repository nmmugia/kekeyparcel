import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const { packageId, customerName, resellerId, resellerName, resellerEmail } = body

    // Validate required fields
    if (!packageId || !customerName || !resellerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get package data
    const packageData = await db.package.findUnique({
      where: {
        id: packageId,
      },
    })

    if (!packageData) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    // Create transaction
    const transaction = await db.transaction.create({
      data: {
        packageName: packageData.name,
        packageDescription: packageData.description,
        pricePerWeek: packageData.pricePerWeek,
        tenor: packageData.tenor,
        isEligibleBonus: packageData.isEligibleBonus,
        customerName,
        resellerId,
        resellerName,
        resellerEmail,
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}

