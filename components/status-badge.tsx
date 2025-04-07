import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: "process" | "confirmed" | "rejected"
  size?: "sm" | "md" | "lg"
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  // Map status to variant and text
  const statusConfig = {
    process: {
      variant: "warning" as const,
      text: "Proses",
    },
    confirmed: {
      variant: "success" as const,
      text: "Dikonfirmasi",
    },
    rejected: {
      variant: "destructive" as const,
      text: "Ditolak",
    },
  }

  const config = statusConfig[status]

  // Determine size class
  const sizeClass = {
    sm: "text-xs px-1.5 py-0",
    md: "text-xs px-2.5 py-0.5",
    lg: "text-sm px-3 py-1",
  }[size]

  return (
    <Badge variant={config.variant} className={sizeClass}>
      {config.text}
    </Badge>
  )
}

