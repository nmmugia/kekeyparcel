import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import MemberForm from "@/components/member/member-form"

interface EditMemberPageProps {
  params: {
    id: string
  }
}

export default async function EditMemberPage({ params }: EditMemberPageProps) {
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

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Reseller</h1>
      <MemberForm user={user} />
    </div>
  )
}

