import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DeletionRequestsList from "@/components/report/deletion-requests-list"

export default async function DeletionRequestsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Permintaan Hapus Transaksi</h1>
      <DeletionRequestsList />
    </div>
  )
}
