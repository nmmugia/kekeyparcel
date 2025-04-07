"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  children?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-8 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{description}</p>

        {action && (
          <Button onClick={action.onClick} className="bg-pink-500 hover:bg-pink-600">
            {action.label}
          </Button>
        )}

        {children}
      </div>
    </div>
  )
}

