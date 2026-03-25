import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import ResellerReport from "@/components/report/reseller-report"

export default async function ResellerReportPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "reseller") {
    redirect("/home")
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Laporan Transaksi</h1>
      <ResellerReport userId={session.user.id} userName={session.user.name} />
    </div>
  )
}
