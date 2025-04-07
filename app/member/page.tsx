import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import MemberList from "@/components/member/member-list"

export default async function MemberPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  // Get all resellers
  const resellers = await db.user.findMany({
    where: {
      role: "reseller",
    },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          transactions: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <MemberList resellers={resellers} />
    </div>
  )
}

