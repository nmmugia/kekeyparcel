"use client"

import { useRef, useEffect } from "react"
import { signOut } from "next-auth/react"
import Link from "next/link"
import {
  X,
  LogOut,
  User,
  Lock,
  Trash2,
  FolderPlus,
  Home,
  FileText,
  Package,
  Users,
  CreditCard,
  BarChart,
} from "lucide-react"

interface SideMenuProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
}

export default function SideMenu({ isOpen, onClose, userRole }: SideMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose])

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isOpen])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Side Menu */}
      <div
        ref={menuRef}
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold text-pink-600">Menu</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close menu">
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <nav className="p-4">
              <ul className="space-y-2">
                <li>
                  <Link href="/home" className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                    <Home className="h-5 w-5 mr-3 text-pink-500" />
                    <span>Daftar Paket</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/transaction"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <FileText className="h-5 w-5 mr-3 text-pink-500" />
                    <span>Transaksi</span>
                  </Link>
                </li>

                {userRole === "reseller" ? (
                  <>
                    <li>
                      <Link
                        href="/my-packages"
                        className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                      >
                        <Package className="h-5 w-5 mr-3 text-pink-500" />
                        <span>Paketku</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/report" className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                        <BarChart className="h-5 w-5 mr-3 text-pink-500" />
                        <span>Laporan</span>
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/member" className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                        <Users className="h-5 w-5 mr-3 text-pink-500" />
                        <span>Daftar Reseller</span>
                      </Link>
                    </li>
                  </>
                )}

                <li>
                  <Link href="/profile" className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700">
                    <User className="h-5 w-5 mr-3 text-pink-500" />
                    <span>Profil</span>
                  </Link>
                </li>

                <li>
                  <Link
                    href="/change-password"
                    className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                  >
                    <Lock className="h-5 w-5 mr-3 text-pink-500" />
                    <span>Ubah Kata Sandi</span>
                  </Link>
                </li>

                {userRole === "admin" && (
                  <>
                    <li>
                      <Link
                        href="/package-type"
                        className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                      >
                        <FolderPlus className="h-5 w-5 mr-3 text-pink-500" />
                        <span>Tipe Paket</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/payment-settings"
                        className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                      >
                        <CreditCard className="h-5 w-5 mr-3 text-pink-500" />
                        <span>Pengaturan Pembayaran</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/delete-payment-proof"
                        className="flex items-center p-2 rounded-lg hover:bg-gray-100 text-gray-700"
                      >
                        <Trash2 className="h-5 w-5 mr-3 text-pink-500" />
                        <span>Hapus Bukti Pembayaran</span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center w-full p-2 rounded-lg hover:bg-gray-100 text-gray-700"
            >
              <LogOut className="h-5 w-5 mr-3 text-pink-500" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

