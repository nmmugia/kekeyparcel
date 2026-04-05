import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
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

  // Calculate totals securely with standard Prisma methods
  // Since the migration to Turso (SQLite), $queryRaw errors out due to driver adapter URL requirements.
  // Standard Prisma methods run fully optimized logic.
  
  const allTransactions = await db.transaction.findMany({
    select: { pricePerWeek: true, tenor: true }
  });
  const grandTotal = allTransactions.reduce((acc, t) => acc + (t.pricePerWeek * t.tenor), 0);

  const confirmedAggr = await db.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'confirmed' }
  });
  const totalConfirmed = confirmedAggr._sum.amount || 0;

  const processingAggr = await db.payment.aggregate({
    _sum: { amount: true },
    where: { status: 'process' }
  });
  const totalProcessing = processingAggr._sum.amount || 0;

  const totalRemaining = grandTotal - totalConfirmed - totalProcessing;

  const transactionCount = await db.transaction.count();

  const confirmedCount = await db.payment.groupBy({
    by: ['transactionId'],
    where: { status: 'confirmed' },
  });
  const processingCount = await db.payment.groupBy({
    by: ['transactionId'],
    where: { status: 'process' },
  });

  const reportTotals = {
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
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Laporan Pendapatan</h1>
      <ReportSummary totals={reportTotals} />
    </div>
  )
}

