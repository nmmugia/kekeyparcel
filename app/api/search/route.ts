import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type") || "all"

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    let results: any = []

    // Search based on type
    switch (type) {
      case "packages":
        results = await db.package.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 10,
          include: {
            packageType: true,
          },
        })
        break

      case "transactions":
        results = await db.transaction.findMany({
          where: {
            OR: [
              { packageName: { contains: query, mode: "insensitive" } },
              { customerName: { contains: query, mode: "insensitive" } },
              { resellerName: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 10,
          include: {
            payments: {
              where: {
                status: "confirmed",
              },
            },
          },
        })
        break

      case "members":
        // Only admin can search members
        if (session.user.role !== "admin") {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        results = await db.user.findMany({
          where: {
            role: "reseller",
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 10,
          select: {
            id: true,
            name: true,
            email: true,
            _count: {
              select: {
                transactions: true,
              },
            },
          },
        })
        break

      case "payments":
        // Filter payments based on user role
        const paymentWhere: any = {
          OR: [
            { transaction: { packageName: { contains: query, mode: "insensitive" } } },
            { transaction: { customerName: { contains: query, mode: "insensitive" } } },
          ],
        }

        if (session.user.role !== "admin") {
          paymentWhere.resellerId = session.user.id
        }

        results = await db.payment.findMany({
          where: paymentWhere,
          take: 10,
          include: {
            transaction: true,
          },
        })
        break

      default:
        // Search all types
        const packages = await db.package.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          take: 5,
          include: {
            packageType: true,
          },
        })

        const transactionWhere: any = {
          OR: [
            { packageName: { contains: query, mode: "insensitive" } },
            { customerName: { contains: query, mode: "insensitive" } },
          ],
        }

        if (session.user.role !== "admin") {
          transactionWhere.resellerId = session.user.id
        }

        const transactions = await db.transaction.findMany({
          where: transactionWhere,
          take: 5,
          include: {
            payments: {
              where: {
                status: "confirmed",
              },
            },
          },
        })

        results = {
          packages,
          transactions,
        }

        // Add members search for admin
        if (session.user.role === "admin") {
          const members = await db.user.findMany({
            where: {
              role: "reseller",
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
            take: 5,
            select: {
              id: true,
              name: true,
              email: true,
              _count: {
                select: {
                  transactions: true,
                },
              },
            },
          })

          results.members = members
        }
        break
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error searching:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}

