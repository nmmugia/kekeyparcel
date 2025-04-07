import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import PackageForm from "@/components/package/package-form"

interface EditPackagePageProps {
  params: {
    id: string
  }
}

export default async function EditPackagePage({ params }: EditPackagePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  const packageData = await db.package.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!packageData) {
    notFound()
  }

  const packageTypes = await db.packageType.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Paket</h1>
      <PackageForm packageTypes={packageTypes} packageData={packageData} />
    </div>
  )
}

