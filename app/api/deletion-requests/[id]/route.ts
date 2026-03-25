import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

// PATCH - Approve or reject a deletion request (admin only)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await request.json()
        const { status, adminNote } = body

        if (!status || !["approved", "rejected"].includes(status)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 })
        }

        const deletionRequest = await db.deletionRequest.findUnique({
            where: { id },
            include: { transaction: true },
        })

        if (!deletionRequest) {
            return NextResponse.json({ error: "Deletion request not found" }, { status: 404 })
        }

        if (deletionRequest.status !== "pending") {
            return NextResponse.json({ error: "This request has already been processed" }, { status: 400 })
        }

        // If approved, actually delete the transaction and its payments
        if (status === "approved") {
            // Delete all related payments first
            await db.payment.deleteMany({
                where: { transactionId: deletionRequest.transactionId },
            })

            // Delete all deletion requests for this transaction
            await db.deletionRequest.deleteMany({
                where: { transactionId: deletionRequest.transactionId },
            })

            // Delete the transaction
            await db.transaction.delete({
                where: { id: deletionRequest.transactionId },
            })

            return NextResponse.json({ success: true, message: "Transaksi berhasil dihapus" })
        }

        // If rejected, update the status
        const updatedRequest = await db.deletionRequest.update({
            where: { id },
            data: {
                status,
                adminNote: adminNote || null,
            },
        })

        return NextResponse.json(updatedRequest)
    } catch (error) {
        console.error("Error processing deletion request:", error)
        return NextResponse.json({ error: "Failed to process deletion request" }, { status: 500 })
    }
}
