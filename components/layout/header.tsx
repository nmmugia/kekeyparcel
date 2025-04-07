"use client"

import { useSession } from "next-auth/react"
import { Menu } from "lucide-react"
import { usePathname } from "next/navigation"
import GlobalSearch from "@/components/search/global-search"

interface HeaderProps {
  toggleSideMenu: () => void
}

export default function Header({ toggleSideMenu }: HeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Determine the title based on the current path
  const getTitle = () => {
    if (pathname.includes("/home")) return "Daftar Paket"
    if (pathname.includes("/transaction")) return "Transaksi"
    if (pathname.includes("/my-packages")) return "Paketku"
    if (pathname.includes("/member")) return "Daftar Reseller"
    if (pathname.includes("/package-type")) return "Tipe Paket"
    if (pathname.includes("/profile")) return "Profil"
    if (pathname.includes("/dashboard")) return "Dashboard"
    if (pathname.includes("/payment-settings")) return "Pengaturan Pembayaran"
    return "Aplikasi Paket Cicilan"
  }

  return (
    <header className="sticky top-0 z-10 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSideMenu}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-pink-600">{getTitle()}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div className="hidden sm:block w-64">{session?.user && <GlobalSearch userRole={session.user.role} />}</div>
          <span className="text-sm text-gray-600 hidden sm:inline-block">{session?.user?.name}</span>
        </div>
      </div>
    </header>
  )
}

