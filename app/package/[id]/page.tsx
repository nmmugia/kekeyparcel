import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import PackageDetail from "@/components/package/package-detail"

interface PackagePageProps {
  params: {
    id: string
  }
}

export default async function PackagePage({ params }: PackagePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const packageData = await db.package.findUnique({
    where: {
      id: params.id,
    },
    include: {
      packageType: true,
    },
  })

  const transactionCount = await db.transaction.count({
    where: {
      packageName: packageData?.name, // Assuming you have a foreign key in transactions
      packageDescription: packageData?.description, // Assuming you have a foreign key in transactions
    },
  });

  if (!packageData) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <PackageDetail
        packageData={packageData}
        isAdmin={session.user.role === "admin"}
        userId={session.user.id}
        userName={session.user.name}
        userEmail={session.user.email}
        transactionCount={transactionCount}
      />
    </div>
  )
}

