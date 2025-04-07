import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import PackageTypeForm from "@/components/package-type/package-type-form"

export default async function CreatePackageTypePage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "admin") {
    redirect("/home")
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Tambah Tipe Paket Baru</h1>
      <PackageTypeForm />
    </div>
  )
}

