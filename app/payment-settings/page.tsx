import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import PaymentMethodList from "@/components/payment/payment-method-list"

export default async function PaymentSettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  const paymentMethods = await db.paymentMethod.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Pengaturan Metode Pembayaran</h1>
      <PaymentMethodList paymentMethods={paymentMethods} />
    </div>
  )
}

