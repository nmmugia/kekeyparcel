import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const transaction = await db.transaction.findUnique({
            where: {
                id: params.id,
            },
            include: {
                payments: true,
            },
        })

        if (!transaction) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
        }

        return NextResponse.json(transaction)
    } catch (error) {
        console.error("Error fetching transaction:", error)
        return NextResponse.json({ error: "Failed to fetch transaction" }, { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // First delete all related payments
        await db.payment.deleteMany({
            where: {
                transactionId: params.id,
            },
        })

        // Then delete the transaction
        await db.transaction.delete({
            where: {
                id: params.id,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting transaction:", error)
        return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 })
    }
}
