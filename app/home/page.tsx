import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getCachedData } from "@/lib/cache"
import PackageTypeList from "@/components/package/package-type-list"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Get all package types with their packages, cached via Upstash Redis mapped to 5 minutes
  const packageTypes = await getCachedData(
    "home:packageTypes",
    async () => {
      return await db.packageType.findMany({
        include: {
          packages: {
            take: 5,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      })
    },
    86400 // 1 Full Day TTL
  )

  return (
    <div className="container mx-auto px-4 py-6">
      <PackageTypeList packageTypes={packageTypes} isAdmin={session.user.role === "admin"} />
    </div>
  )
}

