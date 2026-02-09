import type { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import SlideIn from "@/components/animations/slide-in"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColor?: string
  iconBgColor?: string
  loading?: boolean
  delay?: number
}

export default function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "text-pink-600",
  iconBgColor = "bg-pink-100",
  loading = false,
  delay = 0,
}: StatsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-32 mt-2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <SlideIn delay={delay} duration={0.4}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${iconBgColor}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <h3 className="text-lg font-medium">{title}</h3>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{value}</p>
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
        </CardContent>
      </Card>
    </SlideIn>
  )
}

