import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import TransactionDetail from "@/components/transaction/transaction-detail"

interface TransactionPageProps {
  params: {
    id: string
  }
}

export default async function TransactionPage({ params }: TransactionPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const transaction = await db.transaction.findUnique({
    where: {
      id: params.id,
    },
    include: {
      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!transaction) {
    notFound()
  }

  // Check if user is authorized to view this transaction
  if (session.user.role !== "admin" && transaction.resellerId !== session.user.id) {
    redirect("/home")
  }

  const paymentMethods = await db.paymentMethod.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <TransactionDetail
        transaction={transaction}
        paymentMethods={paymentMethods}
        isAdmin={session.user.role === "admin"}
        userId={session.user.id}
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </div>
  )
}

