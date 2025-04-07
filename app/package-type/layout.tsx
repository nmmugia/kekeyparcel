import type React from "react"
import MainLayout from "@/components/layout/main-layout"

export default function PackageTypeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}

