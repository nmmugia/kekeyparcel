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
        const resellerId = searchParams.get("resellerId")

        if (!resellerId) {
            return NextResponse.json({ error: "Reseller ID is required" }, { status: 400 })
        }

        // Only allow resellers to see their own data, admins can see any
        if (session.user.role === "reseller" && session.user.id !== resellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        const transactions = await db.transaction.findMany({
            where: {
                resellerId,
            },
            include: {
                payments: true,
                deletionRequests: {
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json(transactions)
    } catch (error) {
        console.error("Error fetching reseller report:", error)
        return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
    }
}
