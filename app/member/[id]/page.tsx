import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import MemberDetail from "@/components/member/member-detail"

interface MemberPageProps {
  params: {
    id: string
  }
}

export default async function MemberPage({ params }: MemberPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }
  const { id } = await params
  const user = await db.user.findUnique({
    where: {
      id: id,
      role: "reseller",
    },
    include: {
      _count: {
        select: {
          transactions: true,
        },
      },
      transactions: {
        take: 5,
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
      },
    },
  })

  if (!user) {
    notFound()
  }

  const formattedUser = {
    ...user,
    transactions: user.transactions.map((t: any) => ({
      ...t,
      payments: t.payments.map((p: any) => ({
        ...p,
        weekNumbers: typeof p.weekNumbers === "string" ? JSON.parse(p.weekNumbers) : p.weekNumbers
      }))
    }))
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <MemberDetail user={formattedUser} />
    </div>
  )
}

