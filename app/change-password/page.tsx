import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import ChangePasswordForm from "@/components/profile/change-password-form"

export default async function ChangePasswordPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Ubah Kata Sandi</h1>
      <ChangePasswordForm userId={session.user.id} />
    </div>
  )
}

