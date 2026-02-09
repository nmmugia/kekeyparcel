"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import BottomNavigation from "@/components/navigation/bottom-navigation"
import SideMenu from "@/components/navigation/side-menu"
import Header from "@/components/layout/header"
import { LoadingSpinner } from "@/components/loading-spinner"

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false)
  const pathname = usePathname()
  const { data: session, status } = useSession()

  const toggleSideMenu = () => {
    setIsSideMenuOpen(!isSideMenuOpen)
  }

  const closeSideMenu = () => {
    setIsSideMenuOpen(false)
  }

  // Close side menu when route changes
  useEffect(() => {
    closeSideMenu()
  }, [pathname])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header toggleSideMenu={toggleSideMenu} />

      <main className="flex-1 pb-16">{children}</main>

      <SideMenu isOpen={isSideMenuOpen} onClose={closeSideMenu} userRole={session?.user?.role || "reseller"} />

      <BottomNavigation userRole={session?.user?.role || "reseller"} />
    </div>
  )
}

