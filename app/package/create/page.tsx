import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import PackageForm from "@/components/package/package-form"

interface CreatePackagePageProps {
  searchParams: {
    typeId?: string
  }
}

export default async function CreatePackagePage({ searchParams }: CreatePackagePageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  const packageTypes = await db.packageType.findMany({
    orderBy: {
      name: "asc",
    },
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Tambah Paket Baru</h1>
      <PackageForm packageTypes={packageTypes} defaultTypeId={searchParams.typeId} />
    </div>
  )
}

