import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import SearchPage from "@/components/search/search-page"

export default async function Search({
  searchParams,
}: {
  searchParams: { q?: string; type?: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const query = searchParams.q || ""
  const type = searchParams.type || "all"

  return (
    <div className="container mx-auto px-4 py-6">
      <SearchPage initialQuery={query} initialType={type} userRole={session.user.role} />
    </div>
  )
}

