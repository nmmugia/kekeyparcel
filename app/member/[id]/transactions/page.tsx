import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import MemberTransactions from "@/components/member/member-transactions"

interface MemberTransactionsPageProps {
  params: {
    id: string
  }
}

export default async function MemberTransactionsPage({ params }: MemberTransactionsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  const user = await db.user.findUnique({
    where: {
      id: params.id,
      role: "reseller",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  })

  if (!user) {
    notFound()
  }

  const transactions = await db.transaction.findMany({
    where: {
      resellerId: params.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      payments: {
        where: {
          status: "confirmed",
        },
      },
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <MemberTransactions user={user} transactions={transactions} />
    </div>
  )
}

