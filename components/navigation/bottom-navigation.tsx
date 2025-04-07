"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Package, Users, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  userRole: string
}

export default function BottomNavigation({ userRole }: BottomNavigationProps) {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex justify-around items-center h-16">
        <NavItem href="/home" icon={<Home className="h-6 w-6" />} label="Paket" isActive={isActive("/home")} />

        <NavItem
          href="/transaction"
          icon={<FileText className="h-6 w-6" />}
          label="Transaksi"
          isActive={isActive("/transaction")}
        />

        {userRole === "reseller" ? (
          <NavItem
            href="/my-packages"
            icon={<Package className="h-6 w-6" />}
            label="Paketku"
            isActive={isActive("/my-packages")}
          />
        ) : (
          <>
            <NavItem
              href="/member"
              icon={<Users className="h-6 w-6" />}
              label="Reseller"
              isActive={isActive("/member")}
            />
            <NavItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-6 w-6" />}
              label="Dashboard"
              isActive={isActive("/dashboard")}
            />
          </>
        )}
      </div>
    </nav>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive: boolean
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full",
        isActive ? "text-pink-600" : "text-gray-500 hover:text-pink-500",
      )}
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </Link>
  )
}

