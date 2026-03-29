import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getCachedData } from "@/lib/cache"
import ReportSummary from "@/components/report/report-summary"

export default async function ReportPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Redirect resellers to their own report page
  if (session.user.role === "reseller") {
    redirect("/reseller-report")
  }

  // Calculate and instantly cache the heavy math aggregations for 2 minutes to block Neon spamming
  const reportTotals = await getCachedData('report:totals:admin', async () => {
    // Instantly aggregate the totals deep inside Postgres using Prisma $queryRaw
    const totalsResult: any = await db.$queryRaw`
      SELECT 
        COALESCE(SUM("pricePerWeek" * "tenor"), 0) as "grandTotal",
        (SELECT COALESCE(SUM(amount), 0) FROM "Payment" WHERE status = 'confirmed') as "totalConfirmed",
        (SELECT COALESCE(SUM(amount), 0) FROM "Payment" WHERE status = 'process') as "totalProcessing"
      FROM "Transaction"
    `
    
    const grandTotal = Number(totalsResult[0]?.grandTotal || 0)
    const totalConfirmed = Number(totalsResult[0]?.totalConfirmed || 0)
    const totalProcessing = Number(totalsResult[0]?.totalProcessing || 0)
    const totalRemaining = grandTotal - totalConfirmed - totalProcessing

    // Just grab simple count stats for UI
    const transactionCount = await db.transaction.count()
    const confirmedCount = await db.payment.groupBy({
      by: ['transactionId'],
      where: { status: 'confirmed' },
    })
    const processingCount = await db.payment.groupBy({
      by: ['transactionId'],
      where: { status: 'process' },
    })

    // Group totals payload securely bypassing megabytes of JSON transfer
    return {
      grandTotal,
      totalConfirmed,
      totalProcessing,
      totalRemaining,
      counts: {
        total: transactionCount,
        confirmed: confirmedCount.length,
        processing: processingCount.length,
        unpaid: Math.max(0, transactionCount - confirmedCount.length - processingCount.length)
      }
    }
  }, 120)

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Laporan Pendapatan</h1>
      <ReportSummary totals={reportTotals} />
    </div>
  )
}

