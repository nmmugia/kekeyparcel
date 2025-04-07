import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import PackageTypeDetail from "@/components/package-type/package-type-detail"

interface PackageTypePageProps {
  params: {
    id: string
  }
}

export default async function PackageTypePage({ params }: PackageTypePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const packageType = await db.packageType.findUnique({
    where: {
      id: params.id,
    },
    include: {
      packages: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!packageType) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PackageTypeDetail packageType={packageType} isAdmin={session.user.role === "admin"} />
    </div>
  )
}

