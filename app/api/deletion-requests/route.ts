import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// GET - List deletion requests (admin sees all, reseller sees own)
export async function GET(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status") || "pending"

        const where: any = { status }

        // Resellers can only see their own requests
        if (session.user.role === "reseller") {
            where.requestedById = session.user.id
        }

        const deletionRequests = await db.deletionRequest.findMany({
            where,
            include: {
                transaction: {
                    include: {
                        payments: true,
                    },
                },
                requestedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return NextResponse.json(deletionRequests)
    } catch (error) {
        console.error("Error fetching deletion requests:", error)
        return NextResponse.json({ error: "Failed to fetch deletion requests" }, { status: 500 })
    }
}

// POST - Create a deletion request (reseller only)
export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { transactionId, reason } = body

        if (!transactionId || !reason) {
            return NextResponse.json({ error: "Transaction ID and reason are required" }, { status: 400 })
        }

        // Verify the transaction belongs to the reseller
        const transaction = await db.transaction.findUnique({
            where: { id: transactionId },
        })

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
        }

        if (session.user.role === "reseller" && transaction.resellerId !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        // Check if there's already a pending deletion request for this transaction
        const existingRequest = await db.deletionRequest.findFirst({
            where: {
                transactionId,
                status: "pending",
            },
        })

        if (existingRequest) {
            return NextResponse.json(
                { error: "Sudah ada permintaan hapus yang pending untuk transaksi ini" },
                { status: 400 }
            )
        }

        const deletionRequest = await db.deletionRequest.create({
            data: {
                transactionId,
                requestedById: session.user.id,
                reason,
            },
        })

        return NextResponse.json(deletionRequest)
    } catch (error) {
        console.error("Error creating deletion request:", error)
        return NextResponse.json({ error: "Failed to create deletion request" }, { status: 500 })
    }
}
