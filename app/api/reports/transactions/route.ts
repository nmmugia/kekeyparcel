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
        const status = searchParams.get("status") || "all"
        const page = parseInt(searchParams.get("page") || "1")
        const limit = 15

        let paymentFilter = {}
        if (status === "confirmed") {
            paymentFilter = { some: { status: "confirmed" } }
        } else if (status === "processing") {
            paymentFilter = { some: { status: "process" } }
        } else if (status === "nopayment") {
            // Actually, nopayment means transactions with either 0 payments OR 0 process/confirmed payments.
            paymentFilter = { none: { status: { in: ["confirmed", "process"] } } }
        }

        const where: any = {}

        // Admin sees all, reseller sees only theirs
        if (session.user.role !== "admin") {
            where.resellerId = session.user.id
        }

        if (status !== "all" && status) {
            where.payments = paymentFilter
        }

        const checkHasMore = await db.transaction.count({ where })

        const rawTransactions = await db.transaction.findMany({
            where,
            include: {
                payments: true
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
            skip: (page - 1) * limit,
        })

        // Compute derived properties for UI mapping
        const transactions = rawTransactions.map(t => {
            const confirmedAmount = t.payments.filter(p => p.status === "confirmed").reduce((s, p) => s + p.amount, 0)
            const processingAmount = t.payments.filter(p => p.status === "process").reduce((s, p) => s + p.amount, 0)

            let computedStatus = "nopayment"
            if (confirmedAmount > 0) computedStatus = "confirmed"
            else if (processingAmount > 0) computedStatus = "processing"

            return {
                ...t,
                computedStatus,
                confirmedAmount,
                processingAmount,
                remainingAmount: (t.pricePerWeek * t.tenor) - confirmedAmount - processingAmount
            }
        })

        return NextResponse.json({
            transactions,
            hasMore: page * limit < checkHasMore,
            totalCount: checkHasMore
        })
    } catch (error) {
        console.error("Error fetching paginated report transactions:", error)
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }
}
