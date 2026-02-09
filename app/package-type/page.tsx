import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import PackageTypeList from "@/components/package-type/package-type-list"

export default async function PackageTypePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get all package types with their packages
  const packageTypes = await db.packageType.findMany({
    include: {
      packages: {
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          packages: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Tipe Paket</h1>
      <PackageTypeList packageTypes={packageTypes} isAdmin={session.user.role === "admin"} />
    </div>
  )
}

