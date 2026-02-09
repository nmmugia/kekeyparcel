import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import PackageTypeList from "@/components/package/package-type-list"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get all package types with their packages
  const packageTypes = await db.packageType.findMany({
    include: {
      packages: {
        take: 5, // Only take 5 packages per type for the home page
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <PackageTypeList packageTypes={packageTypes} isAdmin={session.user.role === "admin"} />
    </div>
  )
}

