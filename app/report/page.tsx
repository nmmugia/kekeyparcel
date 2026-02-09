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

  // Get transactions for this user
  const transactions = await db.transaction.findMany({
    include: {
      payments: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Group transactions by payment status
  const noPaymentTransactions = transactions.filter((t) => t.payments.length === 0)
  const withPaymentTransactions = transactions.filter((t) => t.payments.length > 0)

  // Calculate total amounts
  const totalNoPayment = noPaymentTransactions.reduce((sum, t) => sum + t.pricePerWeek * t.tenor, 0)

  // For transactions with payments, calculate confirmed payments
  const transactionsWithPaymentStatus = withPaymentTransactions.map((t) => {
    const confirmedPayments = t.payments.filter((p) => p.status === "confirmed")
    const processingPayments = t.payments.filter((p) => p.status === "process")

    const confirmedAmount = confirmedPayments.reduce((sum, p) => sum + p.amount, 0)
    const processingAmount = processingPayments.reduce((sum, p) => sum + p.amount, 0)

    return {
      ...t,
      confirmedAmount,
      processingAmount,
      remainingAmount: t.pricePerWeek * t.tenor - confirmedAmount - processingAmount,
    }
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Laporan Pendapatan</h1>
      <ReportSummary
        noPaymentTransactions={noPaymentTransactions}
        transactionsWithPayment={transactionsWithPaymentStatus}
        totalNoPayment={totalNoPayment}
      />
    </div>
  )
}

