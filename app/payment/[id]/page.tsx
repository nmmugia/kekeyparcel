import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import PaymentDetail from "@/components/payment/payment-detail"

interface PaymentPageProps {
  params: {
    id: string
  }
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const payment = await db.payment.findUnique({
    where: {
      id: params.id,
    },
    include: {
      transaction: true,
    },
  })

  const paymentMethod = await db.paymentMethod.findUnique({
    where: {
      id: payment?.paymentMethod,
    },
  })

  if (!payment) {
    notFound()
  }

  // Check if user is authorized to view this payment
  if (session.user.role !== "admin" && payment.resellerId !== session.user.id) {
    redirect("/home")
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PaymentDetail payment={payment} isAdmin={session.user.role === "admin"} paymentMethod={paymentMethod}/>
    </div>
  )
}

