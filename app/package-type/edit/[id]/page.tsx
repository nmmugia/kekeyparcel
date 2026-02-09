import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import PackageTypeForm from "@/components/package-type/package-type-form"

interface EditPackageTypePageProps {
  params: {
    id: string
  }
}

export default async function EditPackageTypePage({ params }: EditPackageTypePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  const packageType = await db.packageType.findUnique({
    where: {
      id: params.id,
    },
  })

  if (!packageType) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Edit Tipe Paket</h1>
      <PackageTypeForm packageType={packageType} />
    </div>
  )
}

